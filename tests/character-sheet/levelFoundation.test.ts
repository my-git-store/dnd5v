import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/api/characterSheetAdapter.ts'
import { CHARACTER_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterStorage.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { availableChoicesForProgression, levelUpProgression, progressionForClass } from '../../src/modules/character-sheet/domain/characterProgression.ts'
import type { Character } from '../../src/modules/character-sheet/types/character.ts'
import { validateCharacter } from '../../src/modules/character-sheet/validation/characterValidation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function fighterProgression(level = 1): CharacterProgression {
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

test('level-up preview exposes new choices without mutating the draft', () => {
  const progression = fighterProgression(3)

  const before = JSON.stringify(progression)

  const preview = levelUpProgression({
    ...progression,
    classLevels: progression.classLevels.map((entry) => ({ ...entry })),
    features: [...progression.features],
    choices: Object.fromEntries(Object.entries(progression.choices).map(([key, values]) => [key, [...values]])),
  }, 4, '2024')

  assert.equal(JSON.stringify(progression), before)
  assert.equal(preview.level, 4)
  assert.deepEqual(availableChoicesForProgression(progression, 4, '2024')[0]?.options, ['ability-score-improvement', 'feat'])
  assert.equal(preview.history?.at(-1)?.toLevel, 4)
})

test('duplicate feature references and invalid choice levels fail validation', () => {
  const duplicate = createMockCharacter()
  duplicate.ruleset = '2024'
  duplicate.progression = { ...fighterProgression(), features: ['fighter.level-1.1', 'fighter.level-1.1'] }
  assert.ok(validateCharacter(duplicate).some((error) => error.includes('progression')))

  const invalidChoice = createMockCharacter()
  invalidChoice.ruleset = '2024'
  invalidChoice.progression = { ...fighterProgression(), choiceMetadata: { abilityScoreImprovementLevels: [21], featChoiceLevels: [] } }
  assert.ok(validateCharacter(invalidChoice).some((error) => error.includes('progression')))

  const malformedChoice = createMockCharacter()
  malformedChoice.ruleset = '2024'
  malformedChoice.progression = { ...fighterProgression(), choices: { fightingStyle: [1 as unknown as string] } }
  assert.ok(validateCharacter(malformedChoice).some((error) => error.includes('progression')))

  const invalidClassLevel = createMockCharacter()
  invalidClassLevel.ruleset = '2024'
  invalidClassLevel.progression = { ...fighterProgression(), level: 1, classLevels: [{ classId: 'fighter', level: 2 }] }
  assert.ok(validateCharacter(invalidClassLevel).some((error) => error.includes('progression')))
})

test('level-up data survives adapter save and reload', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()
  source.ruleset = '2024'
  source.extensions.characterCreation = { classId: 'fighter', classLevel: 1 }
  source.progression = fighterProgression()
  source.features = [...source.progression.features]
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage })

  const view = await adapter.load(source.id)
  view.level = 2
  view.progression = levelUpProgression(view.progression!, 2, '2024')
  await adapter.save(view)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character
  assert.equal(saved.progression?.level, 2)
  assert.equal(saved.progression?.classLevels[0]?.level, 2)
  assert.equal(saved.progression?.history?.at(-1)?.toLevel, 2)
  assert.deepEqual(saved.features, saved.progression?.features)
  assert.deepEqual(validateCharacter(saved), [])
})
