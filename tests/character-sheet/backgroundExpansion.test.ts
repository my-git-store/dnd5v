import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_BACKGROUNDS, findRules2024Background, findRules2024Feat, isBackground2024Id } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterSheetView } from '../../src/modules/character-sheet/types/characterView.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function payload(backgroundId: string, baseAbilities: CharacterSheetView['abilities'], overrides: Partial<Parameters<typeof applyCharacterCreation>[1]> = {}): Parameters<typeof applyCharacterCreation>[1] {
  return {
    ruleset: '2024', speciesId: 'human', raceId: 'human', classId: 'wizard', backgroundId,
    originFeatId: findRules2024Background(backgroundId).originFeatId,
    originAbilityChoices: [...findRules2024Background(backgroundId).abilityOptions],
    originAbilityFocus: findRules2024Background(backgroundId).abilityOptions[0],
    name: 'Архивариус', subclass: '', alignment: '', baseAbilities,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
    ...overrides,
  }
}

async function loadView(storage: MemoryStorage): Promise<{ adapter: ReturnType<typeof createCharacterSheetAdapter>; view: CharacterSheetView }> {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  return { adapter, view: await adapter.load(source.id) }
}

test('provides tagged 2024 backgrounds with choices, feat previews and equipment', () => {
  assert.equal(RULES_2024_BACKGROUNDS.length, 16)
  assert.ok(RULES_2024_BACKGROUNDS.every((background) => background.ruleset === '2024' && background.name === background.label))
  assert.ok(RULES_2024_BACKGROUNDS.every((background) => background.abilityOptions.length === 3 && background.skillProficiencies.length === 2 && background.originFeatId && background.choices.length === 1 && background.equipmentOptions.length > 0))
  for (const background of RULES_2024_BACKGROUNDS) {
    assert.equal(isBackground2024Id(background.id), true)
    assert.equal(findRules2024Feat(background.originFeatId).source, 'background')
    assert.equal(background.choices[0]?.kind, 'ability')
    assert.equal(background.choices[0]?.minSelections, 3)
    assert.equal(background.choices[0]?.maxSelections, 3)
  }
  assert.equal(isBackground2024Id('missing-background'), false)
})

test('switches background bonuses and skill sources without stacking or losing class proficiency', async () => {
  const { view } = await loadView(new MemoryStorage())
  const baseAbilities = { ...view.abilities }
  const sage = applyCharacterCreation(view, payload('sage-2024', baseAbilities, { originAbilityFocus: 'intelligence' }))
  const sageArcana = sage.skills.find((skill) => skill.id === 'arcana')
  assert.deepEqual(sageArcana?.proficiencySources, ['class', 'background'])
  assert.equal(sage.abilities.intelligence, baseAbilities.intelligence + 2)
  assert.equal(sage.abilities.wisdom, baseAbilities.wisdom + 1)
  assert.equal(sage.creation?.abilityBonusSources?.intelligence?.[0]?.source, 'background')

  const hermit = applyCharacterCreation(sage, payload('hermit-2024', baseAbilities, { originAbilityFocus: 'constitution' }))
  const hermitArcana = hermit.skills.find((skill) => skill.id === 'arcana')
  const hermitMedicine = hermit.skills.find((skill) => skill.id === 'medicine')
  assert.deepEqual(hermitArcana?.proficiencySources, ['class'])
  assert.deepEqual(hermitMedicine?.proficiencySources, ['background'])
  assert.equal(hermit.abilities.intelligence, baseAbilities.intelligence)
  assert.equal(hermit.abilities.constitution, baseAbilities.constitution + 2)
  assert.equal(hermit.abilities.wisdom, baseAbilities.wisdom + 1)
  assert.equal(hermit.abilities.charisma, baseAbilities.charisma + 1)
  assert.deepEqual(hermit.creation?.abilityBonusSources?.intelligence, [])

  const repeated = applyCharacterCreation(hermit, payload('hermit-2024', baseAbilities, { originAbilityFocus: 'constitution' }))
  assert.deepEqual(repeated.abilities, hermit.abilities)
  assert.deepEqual(repeated.skills.find((skill) => skill.id === 'arcana')?.proficiencySources, ['class'])
})

test('rejects unknown backgrounds and invalid ability choices', async () => {
  const { view } = await loadView(new MemoryStorage())
  assert.throws(() => applyCharacterCreation(view, payload('missing-background', view.abilities)), /Неизвестная предыстория/)
  assert.throws(() => applyCharacterCreation(view, payload('sage-2024', view.abilities, { originAbilityChoices: ['strength', 'dexterity', 'charisma'] })), /Некорректный выбор характеристик/)
  const oldV3 = migrateCharacterV2ToV3(createMockCharacter())
  oldV3.ruleset = '2024'
  oldV3.extensions.characterCreation = { speciesId: 'human', backgroundId: 'missing-background' }
  assert.ok(validateCharacterV3(oldV3).some((error) => error.includes('предыстория D&D 2024')))
})

test('keeps user equipment and persists one generated background kit after reload', async () => {
  const storage = new MemoryStorage()
  const { adapter, view } = await loadView(storage)
  view.inventoryData.items.push({ id: 'user:lantern', name: 'Личная лампа', quantity: 1, weight: null, description: 'Не удалять', equipped: false, properties: [], source: 'user' })
  const first = applyCharacterCreation(view, payload('sage-2024', { ...view.abilities }, { classEquipmentId: 'wizard-2024', backgroundEquipmentId: 'sage-kit-2024' }))
  const second = applyCharacterCreation(first, payload('hermit-2024', { ...view.abilities }, { classEquipmentId: 'wizard-2024', backgroundEquipmentId: 'hermit-kit-2024' }))
  const generated = second.inventoryData.items.filter((item) => item.source === 'creation')
  assert.equal(second.inventoryData.items.some((item) => item.id === 'user:lantern'), true)
  assert.equal(new Set(generated.map((item) => item.id)).size, generated.length)
  assert.equal(generated.some((item) => item.name === 'Книга знаний'), false)
  assert.equal(generated.some((item) => item.name === 'Набор травника'), true)

  await adapter.save(second)
  const raw = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${second.id}`)!) as CharacterV3
  assert.deepEqual(validateCharacterV3(raw), [])
  const reloaded = await adapter.load(second.id)
  assert.equal(reloaded.inventoryData.items.some((item) => item.id === 'user:lantern'), true)
  assert.equal(reloaded.creation?.backgroundId, 'hermit-2024')
  assert.equal(reloaded.creation?.backgroundSkillIds.includes('medicine'), true)
})

test('normalizes an older v3 record without background creation fields', () => {
  const oldV3 = migrateCharacterV2ToV3(createMockCharacter()) as unknown as Record<string, unknown>
  const extensions = oldV3.extensions as Record<string, unknown>
  extensions.characterCreation = undefined
  const normalized = migrateCharacterToV3(oldV3)
  assert.equal(normalized.ruleset, '2014')
  assert.deepEqual(validateCharacterV3(normalized), [])
  assert.equal(normalized.attacks.length > 0, true)
  assert.equal(normalized.spellcasting.knownSpells.length > 0, true)
  assert.equal(normalized.inventory.items.length > 0, true)
  assert.equal(normalized.personality.biography.length >= 0, true)
})
