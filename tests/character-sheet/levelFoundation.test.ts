import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { availableChoicesForProgression, levelUpProgression, progressionForClass } from '../../src/modules/character-sheet/domain/characterProgression.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import type { CharacterProgressionV3 } from '../../src/modules/character-sheet/types/rules.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function fighterProgression(level = 1): CharacterProgressionV3 {
  return progressionForClass({ ruleset: '2024', classId: 'fighter', level })
}

test('level up advances one level and keeps feature references unique', () => {
  const initial = fighterProgression()
  const firstFeature = initial.features[0]
  assert.ok(firstFeature)
  initial.features.push(firstFeature)

  const next = levelUpProgression(initial, 2, '2024')

  assert.equal(next.level, 2)
  assert.deepEqual(next.classLevels, [{ classId: 'fighter', level: 2 }])
  assert.equal(new Set(next.features).size, next.features.length)
  assert.ok(next.features.includes(firstFeature))
  assert.equal(next.history?.at(-1)?.fromLevel, 1)
  assert.equal(next.history?.at(-1)?.toLevel, 2)
  assert.equal(next.gainedFeatures?.filter((gain) => gain.featureId === firstFeature).length, 1)
})

test('level up rejects jumps and values outside the 1..20 envelope', () => {
  const progression = fighterProgression()

  assert.throws(() => levelUpProgression(progression, 3, '2024'), /один уровень/)
  assert.throws(() => levelUpProgression({ ...progression, level: 0 }, 1, '2024'), /один уровень/)
  assert.throws(() => levelUpProgression({ ...progression, level: 20, classLevels: [{ classId: 'fighter', level: 20 }] }, 21, '2024'), /один уровень/)
  assert.throws(() => levelUpProgression({ ...progression, classLevels: [] }, 2, '2024'), /выбранный класс/)
})

test('ASI and feat choice metadata is available only at configured milestones', () => {
  const progression = fighterProgression(3)

  assert.equal(availableChoicesForProgression(progression, 4, '2024').length, 1)
  assert.deepEqual(availableChoicesForProgression(progression, 4, '2024')[0]?.options, ['ability-score-improvement', 'feat'])
  assert.equal(availableChoicesForProgression(progression, 2, '2024').length, 0)
})

test('duplicate feature references and invalid choice levels fail validation', () => {
  const duplicate = migrateCharacterV2ToV3(createMockCharacter())
  duplicate.ruleset = '2024'
  duplicate.progression = { ...fighterProgression(), features: ['fighter.level-1.1', 'fighter.level-1.1'] }
  assert.ok(validateCharacterV3(duplicate).some((error) => error.includes('progression')))

  const invalidChoice = migrateCharacterV2ToV3(createMockCharacter())
  invalidChoice.ruleset = '2024'
  invalidChoice.progression = { ...fighterProgression(), choiceMetadata: { abilityScoreImprovementLevels: [21], featChoiceLevels: [] } }
  assert.ok(validateCharacterV3(invalidChoice).some((error) => error.includes('progression')))

  const malformedChoice = migrateCharacterV2ToV3(createMockCharacter())
  malformedChoice.ruleset = '2024'
  malformedChoice.progression = { ...fighterProgression(), choices: { fightingStyle: [1 as unknown as string] } }
  assert.ok(validateCharacterV3(malformedChoice).some((error) => error.includes('progression')))

  const invalidClassLevel = migrateCharacterV2ToV3(createMockCharacter())
  invalidClassLevel.ruleset = '2024'
  invalidClassLevel.progression = { ...fighterProgression(), level: 1, classLevels: [{ classId: 'fighter', level: 2 }] }
  assert.ok(validateCharacterV3(invalidClassLevel).some((error) => error.includes('progression')))
})

test('level-up data survives adapter save and reload', async () => {
  const storage = new MemoryStorage()
  const source = migrateCharacterV2ToV3(createMockCharacter())
  source.ruleset = '2024'
  source.extensions.characterCreation = { classId: 'fighter', classLevel: 1 }
  source.progression = fighterProgression()
  source.features = [...source.progression.features]
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const view = await adapter.load(source.id)
  view.level = 2
  view.progression = levelUpProgression(view.progression!, 2, '2024')
  await adapter.save(view)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3
  assert.equal(saved.progression?.level, 2)
  assert.equal(saved.progression?.classLevels[0]?.level, 2)
  assert.equal(saved.progression?.history?.at(-1)?.toLevel, 2)
  assert.deepEqual(saved.features, saved.progression?.features)
  assert.deepEqual(validateCharacterV3(saved), [])
})

test('pre-progression v3 receives safe defaults without losing legacy data', () => {
  const old = migrateCharacterV2ToV3(createMockCharacter())
  const attacks = old.attacks.length
  const spells = old.spellcasting.knownSpells.length
  const inventory = old.inventory.items.length
  delete old.progression
  delete old.features

  const migrated = migrateCharacterToV3(old)
  assert.deepEqual(migrated.progression?.features, [])
  assert.equal(migrated.attacks.length, attacks)
  assert.equal(migrated.spellcasting.knownSpells.length, spells)
  assert.equal(migrated.inventory.items.length, inventory)
  assert.deepEqual(validateCharacterV3(migrated), [])
})
