import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_BACKGROUNDS, RULES_2024_CLASSES, getRules2024Class, getRules2024Feature, RULES_2024_FEATURES } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import type { CharacterSheetView } from '../../src/modules/character-sheet/types/characterView.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function modernPayload(view: CharacterSheetView, classId = 'wizard'): Parameters<typeof applyCharacterCreation>[1] {
  const background = RULES_2024_BACKGROUNDS[0]!
  const classDefinition = getRules2024Class(classId)!
  return {
    ruleset: '2024', speciesId: 'human', raceId: 'human', classId, backgroundId: background.id, originFeatId: background.originFeatId,
    originAbilityChoices: [...background.abilityOptions], originAbilityFocus: background.abilityOptions[0], name: view.name,
    subclass: '', alignment: '', baseAbilities: { ...(view.creation?.baseAbilityScores ?? view.abilities) },
    classSkillIds: classDefinition.skillOptions.slice(0, classDefinition.skillChoiceCount),
    raceSkillChoices: [], raceAbilityChoices: [],
  }
}

test('old v3 characters receive a safe progression default without a schema bump', () => {
  const old = migrateCharacterV2ToV3(createMockCharacter())
  delete old.progression
  const migrated = migrateCharacterToV3(old)

  assert.equal(migrated.schemaVersion, 3)
  assert.equal(migrated.progression?.level, migrated.identity.level)
  assert.deepEqual(migrated.progression?.classLevels, [])
  assert.deepEqual(migrated.progression?.features, [])
  assert.deepEqual(validateCharacterV3(migrated), [])
})

test('2024 class selection stores references and choices without duplicating feature content', async () => {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const view = await adapter.load(source.id)
  const selected = applyCharacterCreation(view, modernPayload(view))
  const classDefinition = getRules2024Class('wizard')!

  assert.deepEqual(selected.progression?.classLevels, [{ classId: 'wizard', level: selected.level }])
  assert.deepEqual(selected.progression?.features, classDefinition.levelFeaturesMetadata.map((feature) => feature.id))
  assert.deepEqual(selected.progression?.choices.classSkills, classDefinition.skillOptions.slice(0, classDefinition.skillChoiceCount))
  assert.equal(selected.progression?.features.every((id) => typeof id === 'string'), true)
  assert.equal(JSON.stringify(selected.progression).includes('Колдовство'), false)
})

test('feature metadata is generated from class level metadata and remains display-only', () => {
  assert.equal(RULES_2024_FEATURES.length, RULES_2024_CLASSES.reduce((count, item) => count + item.levelFeaturesMetadata.length, 0))
  const feature = getRules2024Feature('wizard.level-1.1')!
  assert.equal(feature.ruleset, '2024')
  assert.equal(feature.classId, 'wizard')
  assert.equal(feature.level, 1)
  assert.equal(feature.source, 'class')
  assert.equal(feature.metadata.referenceOnly, true)
})

test('progression level and non-UI fields round-trip through the adapter', async () => {
  const storage = new MemoryStorage()
  const character = migrateCharacterV2ToV3(createMockCharacter())
  character.progression = { level: 1, classLevels: [{ classId: 'wizard', level: 1 }], features: ['wizard.level-1.1'], choices: { classSkills: ['arcana'] } }
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`, JSON.stringify(character))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const view = await adapter.load(character.id)
  view.level = 2
  view.progression!.choices.classSkills = ['history']
  await adapter.save(view)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`)!) as CharacterV3

  assert.equal(saved.progression?.level, 2)
  assert.deepEqual(saved.progression?.classLevels, [{ classId: 'wizard', level: 2 }])
  assert.deepEqual(saved.progression?.choices.classSkills, ['history'])
  assert.equal(saved.attacks.length, character.attacks.length)
  assert.equal(saved.spellcasting.knownSpells.length, character.spellcasting.knownSpells.length)
  assert.equal(saved.inventory.items.length, character.inventory.items.length)
  assert.deepEqual(saved.personality, character.personality)
})

test('invalid progression levels and missing class references are rejected', () => {
  const invalidLevel = migrateCharacterV2ToV3(createMockCharacter())
  invalidLevel.progression = { level: 0, classLevels: [], features: [], choices: {} }
  assert.ok(validateCharacterV3(invalidLevel).some((error) => error.includes('progression')))

  const missingClass = migrateCharacterV2ToV3(createMockCharacter())
  missingClass.ruleset = '2024'
  missingClass.progression = { level: 1, classLevels: [{ classId: '', level: 1 }], features: [], choices: {} }
  assert.ok(validateCharacterV3(missingClass).some((error) => error.includes('progression')))
})
