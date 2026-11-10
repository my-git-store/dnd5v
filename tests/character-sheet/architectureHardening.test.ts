import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/api/characterSheetAdapter.ts'
import { CHARACTER_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/api/characterStorage.ts'
import { createMockCharacter } from '../../src/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/domain/characterCreation.ts'
import { promoteCharacterTo2024 } from '../../src/domain/ruleset.ts'
import type { Character } from '../../src/types/character.ts'
import { validateCharacter } from '../../src/validation/characterValidation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

test('loads both rulesets through the same adapter contract', async () => {
  const legacy = createMockCharacter()

  const legacyStorage = new MemoryStorage()
  legacyStorage.setItem(`${CHARACTER_STORAGE_PREFIX}${legacy.id}`, JSON.stringify(legacy))
  const legacyAdapter = createCharacterSheetAdapter({ storage: legacyStorage })

  const legacyView = await legacyAdapter.load(legacy.id)
  assert.equal(legacyView.ruleset, '2014')
  assert.equal(legacyView.spellcasting.spellRuleset, '2014')

  const modern = promoteCharacterTo2024(legacy)

  const modernStorage = new MemoryStorage()
  modernStorage.setItem(`${CHARACTER_STORAGE_PREFIX}${modern.id}`, JSON.stringify(modern))
  const modernAdapter = createCharacterSheetAdapter({ storage: modernStorage })

  const modernView = await modernAdapter.load(modern.id)
  assert.equal(modernView.ruleset, '2024')
  assert.equal(modernView.spellcasting.spellRuleset, '2024')
})

test('keeps non-creation collections during a 2014 to 2024 creation switch and round-trip', async () => {
  const source = createMockCharacter()
  source.attacks[0]!.attackBonus = '1d20+7'
  source.spellcasting.knownSpells[0]!.description = 'Сохранить при смене редакции'
  source.inventory.items[0]!.quantity = 4
  source.personality.biography = 'История должна пережить смену редакции.'
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage })

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
  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character
  assert.equal(saved.ruleset, '2024')
  assert.equal(saved.attacks[0]?.attackBonus, '1d20+7')
  assert.equal(saved.spellcasting.knownSpells[0]?.description, 'Сохранить при смене редакции')
  assert.equal(saved.inventory.items.find((item) => item.id === preservedItemId)?.quantity, 4)
  assert.equal(saved.personality.biography, 'История должна пережить смену редакции.')
  assert.deepEqual(validateCharacter(saved), [])
})

test('keeps proficiency sources unique and explains a shared class/background source', async () => {
  const source = createMockCharacter()

  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage })

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
