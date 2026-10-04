import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_BACKGROUNDS, RULES_2024_CLASSES, getRules2024Class, isRules2024ClassId } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterSheetView } from '../../src/modules/character-sheet/types/characterView.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function modernPayload(view: CharacterSheetView, classId: string, backgroundId = 'sage-2024', overrides: Partial<Parameters<typeof applyCharacterCreation>[1]> = {}): Parameters<typeof applyCharacterCreation>[1] {
  const background = RULES_2024_BACKGROUNDS.find((item) => item.id === backgroundId)!
  return {
    ruleset: '2024', speciesId: 'human', raceId: 'human', classId, backgroundId, originFeatId: background.originFeatId,
    originAbilityChoices: [...background.abilityOptions], originAbilityFocus: background.abilityOptions[0], name: view.name,
    subclass: '', alignment: '', baseAbilities: { ...(view.creation?.baseAbilityScores ?? view.abilities) },
    classSkillIds: getRules2024Class(classId)?.skillOptions.slice(0, getRules2024Class(classId)?.skillChoiceCount ?? 0) ?? [],
    raceSkillChoices: [], raceAbilityChoices: [], ...overrides,
  }
}

async function loadView(storage: MemoryStorage): Promise<{ adapter: ReturnType<typeof createCharacterSheetAdapter>; view: CharacterSheetView }> {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  return { adapter, view: await adapter.load(source.id) }
}

test('publishes twelve tagged class definitions with canonical foundation metadata', () => {
  assert.equal(RULES_2024_CLASSES.length, 12)
  assert.equal(new Set(RULES_2024_CLASSES.map((item) => item.id)).size, 12)
  assert.ok(RULES_2024_CLASSES.every((item) => item.ruleset === '2024' && item.name === item.label && item.description && /^d\d+$/.test(item.hitDie)))
  assert.ok(RULES_2024_CLASSES.every((item) => item.primaryAbilities.length > 0 && item.savingThrowProficiencies.length === 2 && item.skillChoices.count === item.skillChoiceCount && item.skillChoices.options.length > 0))
  assert.ok(RULES_2024_CLASSES.every((item) => Array.isArray(item.weaponProficiencies) && Array.isArray(item.armorProficiencies) && item.startingEquipment.length > 0 && item.levelFeaturesMetadata.every((feature) => feature.level === 1)))
  assert.ok(RULES_2024_CLASSES.some((item) => item.spellProgressionType === 'prepared'))
  assert.ok(RULES_2024_CLASSES.some((item) => item.spellProgressionType === 'known'))
  assert.equal(isRules2024ClassId('wizard'), true)
  assert.equal(isRules2024ClassId('missing-class'), false)
  assert.equal(getRules2024Class('missing-class'), undefined)
})

test('rejects unknown modern class IDs instead of silently selecting a fallback', async () => {
  const { view } = await loadView(new MemoryStorage())
  assert.throws(() => applyCharacterCreation(view, modernPayload(view, 'missing-class')), /Неизвестный класс/)
  const invalid = migrateCharacterV2ToV3(createMockCharacter())
  invalid.ruleset = '2024'
  invalid.extensions.characterCreation = { classId: 'missing-class' }
  assert.ok(validateCharacterV3(invalid).some((error) => error.includes('класс')))
})

test('class change replaces class skill and saving sources while preserving background and manual sources', async () => {
  const { view } = await loadView(new MemoryStorage())
  view.savingThrows.dexterity.proficient = true
  const wizard = applyCharacterCreation(view, modernPayload(view, 'wizard', 'sage-2024', { classSkillIds: ['arcana', 'history'] }))
  const wizardArcana = wizard.skills.find((skill) => skill.id === 'arcana')!
  assert.deepEqual(wizardArcana.proficiencySources, ['class', 'background'])
  wizardArcana.proficiencySources = ['race', 'class', 'background']
  assert.equal(wizard.spellcasting.spellcastingAbility, 'intelligence')
  const spellCount = wizard.spells.length
  const fighter = applyCharacterCreation(wizard, modernPayload(wizard, 'fighter', 'sage-2024', { classSkillIds: ['athletics', 'survival'] }))
  assert.deepEqual(fighter.skills.find((skill) => skill.id === 'arcana')?.proficiencySources, ['race', 'background'])
  assert.equal(fighter.savingThrows.dexterity.proficient, true)
  assert.deepEqual(fighter.creation?.classSavingThrowKeys, ['strength', 'constitution'])
  assert.equal(fighter.spellcasting.spellcastingAbility, null)
  assert.equal(fighter.spellcasting.spellProgressionType, 'none')
  assert.equal(fighter.spells.length, spellCount)
  assert.equal(fighter.creation?.classLevel, fighter.level)
  assert.deepEqual(fighter.creation?.classSources, [{ kind: 'class', id: 'fighter', label: 'Воин' }])
})

test('class equipment is deterministic, repeatable and preserves user items', async () => {
  const storage = new MemoryStorage()
  const { adapter, view } = await loadView(storage)
  view.inventoryData.items.push({ id: 'user-item', name: 'Свой предмет', quantity: 1, weight: null, description: '', equipped: false, properties: [], source: 'user' })
  const wizard = applyCharacterCreation(view, modernPayload(view, 'wizard', 'sage-2024'))
  const repeated = applyCharacterCreation(wizard, modernPayload(wizard, 'wizard', 'sage-2024'))
  const repeatedCreationIds = repeated.inventoryData.items.filter((item) => item.source === 'creation').map((item) => item.id)
  assert.equal(new Set(repeatedCreationIds).size, repeatedCreationIds.length)
  assert.equal(repeated.inventoryData.items.filter((item) => item.source === 'creation').length, wizard.inventoryData.items.filter((item) => item.source === 'creation').length)
  const fighter = applyCharacterCreation(repeated, modernPayload(repeated, 'fighter', 'sage-2024'))
  assert.equal(fighter.inventoryData.items.some((item) => item.id === 'user-item'), true)
  assert.equal(fighter.inventoryData.items.some((item) => item.id.startsWith(`creation:${fighter.id}:class:wizard`)), false)
  assert.equal(fighter.inventoryData.items.some((item) => item.id.startsWith(`creation:${fighter.id}:class:fighter`)), true)
  await adapter.save(fighter)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${fighter.id}`)!) as CharacterV3
  assert.equal(saved.spellcasting.spellProgressionType, 'none')
  assert.deepEqual((saved.extensions.characterCreation as { classSources?: unknown }).classSources, [{ kind: 'class', id: 'fighter', label: 'Воин' }])
  assert.deepEqual(validateCharacterV3(saved), [])
})

test('old v3 records without class foundation fields remain valid and round-trip through the adapter', async () => {
  const storage = new MemoryStorage()
  const old = migrateCharacterV2ToV3(createMockCharacter())
  delete old.extensions.characterCreation
  delete old.spellcasting.spellProgressionType
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${old.id}`, JSON.stringify(old))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const view = await adapter.load(old.id)
  assert.equal(view.creation, undefined)
  await adapter.save(view)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${old.id}`)!) as CharacterV3
  assert.deepEqual(validateCharacterV3(saved), [])
  assert.equal(saved.attacks.length, old.attacks.length)
  assert.equal(saved.spellcasting.knownSpells.length, old.spellcasting.knownSpells.length)
  assert.equal(saved.inventory.items.length, old.inventory.items.length)
  assert.deepEqual(saved.personality, old.personality)
})

test('creation metadata receives safe class defaults when an older v3 creation object lacks them', async () => {
  const storage = new MemoryStorage()
  const old = migrateCharacterV2ToV3(createMockCharacter())
  old.ruleset = '2024'
  old.extensions.characterCreation = {
    ruleset: '2024', raceId: 'human', classId: 'wizard', baseAbilityScores: { ...old.abilities }, classSkillIds: [], classSavingThrowKeys: [],
  }
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${old.id}`, JSON.stringify(old))
  const view = await adapter.load(old.id)
  assert.equal(view.creation?.classLevel, old.identity.level)
  assert.deepEqual(view.creation?.classSources, [{ kind: 'class', id: 'wizard', label: old.identity.class }])
})
