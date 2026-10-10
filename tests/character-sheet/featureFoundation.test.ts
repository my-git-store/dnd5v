import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_CLASSES, RULES_2024_FEATURES, getRules2024Class, getRules2024ClassFeatures, getRules2024Feature } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

test('class definitions expose canonical class feature references', () => {
  assert.equal(RULES_2024_FEATURES.every((feature) => feature.category === 'class'), true)
  assert.equal(RULES_2024_CLASSES.every((classDefinition) => classDefinition.featureIds?.length === classDefinition.levelFeaturesMetadata.length), true)

  const fighter = getRules2024Class('fighter')!
  const features = getRules2024ClassFeatures('fighter', 1)
  assert.deepEqual(features.map((feature) => feature.id), fighter.featureIds)
  assert.equal(features.every((feature) => feature.classId === fighter.id && feature.level === 1), true)
  assert.equal(features.every((feature) => typeof feature.description === 'string' && feature.description.length > 0), true)
})

test('feature references round-trip through the adapter without embedding feature objects', async () => {
  const storage = new MemoryStorage()
  const source = migrateCharacterV2ToV3(createMockCharacter())
  source.ruleset = '2024'
  source.progression = { level: 1, classLevels: [{ classId: 'fighter', level: 1 }], features: ['fighter.level-1.1'], choices: {} }
  source.features = ['fighter.level-1.1']
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const view = await adapter.load(source.id)
  assert.deepEqual(view.features, ['fighter.level-1.1'])
  assert.deepEqual(view.progression?.features, ['fighter.level-1.1'])
  await adapter.save(view)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3
  assert.deepEqual(saved.features, ['fighter.level-1.1'])
  assert.deepEqual(saved.progression?.features, ['fighter.level-1.1'])
  assert.equal(Object.values(saved).some((value) => typeof value === 'object' && value !== null && JSON.stringify(value).includes('referenceOnly')), false)
  assert.deepEqual(validateCharacterV3(saved), [])
})

test('modern validation rejects unknown and wrong-class feature references', () => {
  const unknown = migrateCharacterV2ToV3(createMockCharacter())
  unknown.ruleset = '2024'
  unknown.progression = { level: 1, classLevels: [{ classId: 'fighter', level: 1 }], features: ['missing-feature'], choices: {} }
  unknown.features = ['missing-feature']
  assert.ok(validateCharacterV3(unknown).some((error) => error.includes('особенности') || error.includes('progression')))

  const wrongClass = migrateCharacterV2ToV3(createMockCharacter())
  wrongClass.ruleset = '2024'
  wrongClass.progression = { level: 1, classLevels: [{ classId: 'fighter', level: 1 }], features: ['wizard.level-1.1'], choices: {} }
  wrongClass.features = ['wizard.level-1.1']
  assert.ok(validateCharacterV3(wrongClass).some((error) => error.includes('progression')))
})

test('old v3 records without feature references receive safe defaults', () => {
  const old = migrateCharacterV2ToV3(createMockCharacter())
  delete old.features
  delete old.progression

  const migrated = migrateCharacterToV3(old)
  assert.deepEqual(migrated.features, [])
  assert.deepEqual(migrated.progression?.features, [])
  assert.deepEqual(validateCharacterV3(migrated), [])
})

test('a pre-progression v3 feature list becomes the synchronized progression view', () => {
  const old = migrateCharacterV2ToV3(createMockCharacter())
  old.ruleset = '2024'
  old.extensions.characterCreation = { classId: 'wizard', classLevel: 1 }
  old.features = ['wizard.level-1.1']
  delete old.progression

  const migrated = migrateCharacterToV3(old)
  assert.deepEqual(migrated.features, ['wizard.level-1.1'])
  assert.deepEqual(migrated.progression?.features, ['wizard.level-1.1'])
  assert.deepEqual(validateCharacterV3(migrated), [])
})

test('feature metadata keeps class source and level for display', () => {
  const feature = getRules2024Feature('wizard.level-1.1')
  assert.ok(feature)
  assert.equal(feature.source, 'class')
  assert.equal(feature.category, 'class')
  assert.equal(feature.classId, 'wizard')
  assert.equal(feature.level, 1)
  assert.equal(feature.metadata.referenceOnly, true)
})
