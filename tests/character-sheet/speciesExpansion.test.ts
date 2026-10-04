import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_SPECIES, isSpecies2024Id } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
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

test('ships the ten 2024 species in one tagged format with fixed traits and choice support', () => {
  assert.deepEqual(RULES_2024_SPECIES.map((species) => species.id), ['aasimar', 'gnome', 'goliath', 'dwarf', 'dragonborn', 'orc', 'halfling', 'human', 'tiefling', 'elf'])
  assert.ok(RULES_2024_SPECIES.every((species) => species.ruleset === '2024' && species.name === species.label && species.description && species.traits.length > 0 && species.languages.length > 0 && Number.isFinite(species.speed) && Array.isArray(species.choices)))
  assert.ok(RULES_2024_SPECIES.some((species) => species.choices.length > 0))
  for (const species of RULES_2024_SPECIES) {
    for (const choice of species.choices) {
      assert.ok(choice.id && choice.label && choice.description)
      assert.ok(choice.options.length >= choice.minSelections)
      assert.ok(choice.maxSelections >= choice.minSelections)
    }
  }
  assert.equal(isSpecies2024Id('dragonborn'), true)
  assert.equal(isSpecies2024Id('not-a-species'), false)
})

test('applies a species choice and replaces it when the species changes', async () => {
  const base = migrateCharacterV2ToV3(createMockCharacter())
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${base.id}`, JSON.stringify(base))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const loaded = await adapter.load(base.id)

  const aasimar = applyCharacterCreation(loaded, {
    ruleset: '2024', speciesId: 'aasimar', raceId: 'aasimar', speciesChoices: { 'celestial-revelation': ['Сияющая душа'] }, classId: 'wizard', backgroundId: 'sage-2024',
    originFeatId: 'magic-initiate-wizard', originAbilityChoices: ['intelligence', 'wisdom', 'constitution'], originAbilityFocus: 'intelligence', name: loaded.name, subclass: '', alignment: '', baseAbilities: loaded.abilities,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  assert.equal(aasimar.creation?.speciesId, 'aasimar')
  assert.deepEqual(aasimar.creation?.speciesChoices, { 'celestial-revelation': ['Сияющая душа'] })
  assert.equal(aasimar.race.name, 'Аасимар')
  assert.equal(aasimar.combat.speed.base, 30)

  const dragonborn = applyCharacterCreation(aasimar, {
    ruleset: '2024', speciesId: 'dragonborn', raceId: 'dragonborn', speciesChoices: { 'draconic-ancestry': ['Красный'] }, classId: 'wizard', backgroundId: 'sage-2024',
    originFeatId: 'magic-initiate-wizard', originAbilityChoices: ['intelligence', 'wisdom', 'constitution'], originAbilityFocus: 'intelligence', name: aasimar.name, subclass: '', alignment: '', baseAbilities: aasimar.creation!.baseAbilityScores,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  assert.equal(dragonborn.creation?.speciesId, 'dragonborn')
  assert.deepEqual(dragonborn.creation?.speciesChoices, { 'draconic-ancestry': ['Красный'] })
  assert.equal(dragonborn.creation?.speciesChoices?.['celestial-revelation'], undefined)
  assert.equal(dragonborn.race.name, 'Драконорождённый')
  assert.equal(dragonborn.combat.speed.base, 30)
})

test('keeps species, class and background source metadata through v3 adapter round-trip', async () => {
  const base = migrateCharacterV2ToV3(createMockCharacter())
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${base.id}`, JSON.stringify(base))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const loaded = await adapter.load(base.id)
  const created = applyCharacterCreation(loaded, {
    ruleset: '2024', speciesId: 'elf', raceId: 'elf', speciesChoices: { 'elven-lineage': ['Лесной эльф'] }, classId: 'wizard', backgroundId: 'sage-2024',
    originFeatId: 'magic-initiate-wizard', originAbilityChoices: ['intelligence', 'wisdom', 'constitution'], originAbilityFocus: 'intelligence', name: loaded.name, subclass: '', alignment: '', baseAbilities: loaded.abilities,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  const arcana = created.skills.find((skill) => skill.id === 'arcana')
  assert.deepEqual(arcana?.proficiencySources, ['class', 'background'])
  created.attacks[0]!.attackBonus = '1d20+6'
  created.spells[0]!.description = 'Не потерять при round-trip'
  created.inventoryData.items[0]!.quantity = 2
  created.personality.biography = 'Сохранить историю'
  await adapter.save(created)

  const raw = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${base.id}`)!) as CharacterV3
  assert.deepEqual(raw.extensions.characterCreation && (raw.extensions.characterCreation as { speciesChoices?: unknown }).speciesChoices, { 'elven-lineage': ['Лесной эльф'] })
  assert.equal(raw.attacks[0]?.attackBonus, '1d20+6')
  assert.equal(raw.spellcasting.knownSpells[0]?.description, 'Не потерять при round-trip')
  assert.equal(raw.inventory.items[0]?.quantity, 2)
  assert.equal(raw.personality.biography, 'Сохранить историю')
  assert.deepEqual(validateCharacterV3(raw), [])

  const reloaded = await adapter.load(base.id)
  assert.deepEqual(reloaded.creation?.speciesChoices, { 'elven-lineage': ['Лесной эльф'] })
})

test('rejects an unknown 2024 species id without changing the storage model', () => {
  const character = migrateCharacterV2ToV3(createMockCharacter())
  character.ruleset = '2024'
  character.extensions.characterCreation = { speciesId: 'unknown-species' }
  assert.ok(validateCharacterV3(character).some((error) => error.includes('Неизвестный вид')))
  assert.throws(() => migrateCharacterToV3(character), /Неизвестный вид|Некорректный/)
})
