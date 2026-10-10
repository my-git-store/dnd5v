import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { migrateV3To2024 } from '../../src/modules/character-sheet/migration/v3To2024.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

test('normalizes a pre-creation v3 record with safe legacy defaults', () => {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  const oldV3 = JSON.parse(JSON.stringify(source)) as Record<string, unknown>
  delete oldV3.ruleset
  delete oldV3.origin
  const spellcasting = oldV3.spellcasting as Record<string, unknown>
  delete spellcasting.spellRuleset

  const normalized = migrateCharacterToV3(oldV3)

  assert.equal(normalized.ruleset, '2014')
  assert.equal(normalized.spellcasting.spellRuleset, '2014')
  assert.equal(normalized.origin.species, normalized.identity.race.name)
  assert.equal(normalized.origin.background, normalized.identity.background.name)
  assert.deepEqual(validateCharacterV3(normalized), [])
})

test('loads both rulesets through the same adapter contract', async () => {
  const legacy = migrateCharacterV2ToV3(createMockCharacter())
  const legacyStorage = new MemoryStorage()
  legacyStorage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${legacy.id}`, JSON.stringify(legacy))
  const legacyAdapter = createCharacterSheetAdapter({ storage: legacyStorage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const legacyView = await legacyAdapter.load(legacy.id)
  assert.equal(legacyView.ruleset, '2014')
  assert.equal(legacyView.spellcasting.spellRuleset, '2014')

  const modern = migrateV3To2024(legacy)
  const modernStorage = new MemoryStorage()
  modernStorage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${modern.id}`, JSON.stringify(modern))
  const modernAdapter = createCharacterSheetAdapter({ storage: modernStorage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const modernView = await modernAdapter.load(modern.id)
  assert.equal(modernView.ruleset, '2024')
  assert.equal(modernView.spellcasting.spellRuleset, '2024')
})

test('keeps non-creation collections during a 2014 to 2024 creation switch and round-trip', async () => {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  source.attacks[0]!.attackBonus = '1d20+7'
  source.spellcasting.knownSpells[0]!.description = 'Сохранить при смене редакции'
  source.inventory.items[0]!.quantity = 4
  source.personality.biography = 'История должна пережить смену редакции.'
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const loaded = await adapter.load(source.id)
  const preservedItemId = loaded.inventoryData.items[0]?.id

  const switched = applyCharacterCreation(loaded, {
    ruleset: '2024', speciesId: 'elf', raceId: 'elf', classId: 'wizard', backgroundId: 'sage-2024', originFeatId: 'magic-initiate-wizard',
    originAbilityChoices: ['intelligence', 'wisdom', 'constitution'], originAbilityFocus: 'intelligence', name: loaded.name, subclass: '', alignment: '', baseAbilities: loaded.abilities,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  assert.equal(switched.ruleset, '2024')
  assert.equal(switched.attacks[0]?.attackBonus, '1d20+7')
  assert.equal(switched.spells[0]?.description, 'Сохранить при смене редакции')
  assert.equal(switched.inventoryData.items.find((item) => item.id === preservedItemId)?.quantity, 4)
  assert.equal(switched.personality.biography, 'История должна пережить смену редакции.')

  await adapter.save(switched)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3
  assert.equal(saved.ruleset, '2024')
  assert.equal(saved.attacks[0]?.attackBonus, '1d20+7')
  assert.equal(saved.spellcasting.knownSpells[0]?.description, 'Сохранить при смене редакции')
  assert.equal(saved.inventory.items.find((item) => item.id === preservedItemId)?.quantity, 4)
  assert.equal(saved.personality.biography, 'История должна пережить смену редакции.')
  assert.deepEqual(validateCharacterV3(saved), [])
})

test('keeps proficiency sources unique and explains a shared class/background source', async () => {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const loaded = await adapter.load(source.id)
  const created = applyCharacterCreation(loaded, {
    ruleset: '2024', speciesId: 'human', raceId: 'human', classId: 'wizard', backgroundId: 'sage-2024', originFeatId: 'magic-initiate-wizard',
    originAbilityChoices: ['intelligence', 'wisdom', 'constitution'], originAbilityFocus: 'intelligence', name: loaded.name, subclass: '', alignment: '', baseAbilities: loaded.abilities,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  const arcana = created.skills.find((skill) => skill.id === 'arcana')
  assert.ok(arcana)
  assert.deepEqual(arcana.proficiencySources, ['class', 'background'])
  assert.equal(new Set(arcana.proficiencySources).size, arcana.proficiencySources.length)
})
