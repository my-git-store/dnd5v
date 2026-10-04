import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { getRules2024Background, getRules2024Class, getSpecies2024 } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { applyCharacterCreation, type CharacterCreationPayload } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { levelUpProgression } from '../../src/modules/character-sheet/domain/characterProgression.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterSheetView } from '../../src/modules/character-sheet/types/characterView.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

const storageKey = (id: string) => `${CHARACTER_V3_STORAGE_PREFIX}${id}`

function adapterFor(storage: MemoryStorage) {
  return createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('Unexpected legacy load') } })
}

function modernPayload(view: CharacterSheetView, speciesId: string, backgroundId: string, classId: string, overrides: Partial<CharacterCreationPayload> = {}): CharacterCreationPayload {
  const background = getRules2024Background(backgroundId)!
  const classDefinition = getRules2024Class(classId)!
  const species = getSpecies2024(speciesId)!
  return {
    ruleset: '2024',
    speciesId,
    raceId: speciesId,
    speciesChoices: Object.fromEntries(species.choices.map((choice) => [choice.id, [choice.options[0]!]])),
    backgroundId,
    originFeatId: background.originFeatId,
    originAbilityChoices: [...background.abilityOptions],
    originAbilityFocus: background.abilityOptions[0],
    classId,
    classSkillIds: classDefinition.skillOptions.slice(0, classDefinition.skillChoiceCount),
    classEquipmentId: classDefinition.equipmentOptions[0]?.id,
    backgroundEquipmentId: background.equipmentOptions[0]?.id,
    name: view.name,
    subclass: '',
    alignment: '',
    baseAbilities: { ...(view.creation?.baseAbilityScores ?? view.abilities) },
    raceSkillChoices: [],
    raceAbilityChoices: [],
    ...overrides,
  }
}

async function loadedMock(storage: MemoryStorage): Promise<CharacterSheetView> {
  const character = migrateCharacterV2ToV3(createMockCharacter())
  storage.setItem(storageKey(character.id), JSON.stringify(character))
  return adapterFor(storage).load(character.id)
}

test('2024 character survives creation, level-up, origin/class changes and adapter reloads', async () => {
  const storage = new MemoryStorage()
  const initial = await loadedMock(storage)
  initial.inventoryData.items.push({ id: 'user:keepsake', name: 'Личный амулет', quantity: 1, weight: null, description: 'Оставить', equipped: false, properties: [], source: 'user' })
  initial.personality.biography = 'История героя сохраняется.'
  initial.attacks[0]!.attackBonus = '+7'
  initial.spells[0]!.description = 'Пользовательское описание заклинания.'

  const wizard = applyCharacterCreation(initial, modernPayload(initial, 'aasimar', 'sage-2024', 'wizard'))
  assert.equal(wizard.ruleset, '2024')
  assert.deepEqual(wizard.creation?.speciesChoices, { 'celestial-revelation': ['Сияющая душа'] })
  assert.equal(wizard.origin.featId, getRules2024Background('sage-2024')!.originFeatId)
  assert.deepEqual(wizard.skills.find((skill) => skill.id === 'arcana')?.proficiencySources, ['class', 'background'])
  assert.equal(wizard.creation?.abilityBonusSources?.intelligence?.[0]?.source, 'background')
  assert.equal(wizard.features?.length, getRules2024Class('wizard')!.featureIds?.length)
  assert.equal(wizard.inventoryData.items.some((item) => item.source === 'creation'), true)
  assert.equal(wizard.inventoryData.items.some((item) => item.id === 'user:keepsake'), true)

  const adapter = adapterFor(storage)
  await adapter.load(wizard.id)
  await adapter.save(wizard)
  const afterCreation = await adapterFor(storage).load(wizard.id)
  assert.deepEqual(afterCreation.creation?.speciesChoices, wizard.creation?.speciesChoices)
  assert.equal(afterCreation.origin.featId, wizard.origin.featId)
  assert.equal(afterCreation.inventoryData.items.some((item) => item.id === 'user:keepsake'), true)

  afterCreation.level = 2
  afterCreation.progression = levelUpProgression(afterCreation.progression!, 2, '2024')
  const levelAdapter = adapterFor(storage)
  await levelAdapter.load(wizard.id)
  await levelAdapter.save(afterCreation)
  const afterLevel = await adapterFor(storage).load(wizard.id)
  assert.equal(afterLevel.level, 2)
  assert.equal(afterLevel.progression?.classLevels[0]?.level, 2)
  assert.equal(afterLevel.progression?.history?.length, 1)
  assert.equal(new Set(afterLevel.progression?.features).size, afterLevel.progression?.features.length)

  const elf = applyCharacterCreation(afterLevel, modernPayload(afterLevel, 'elf', 'sage-2024', 'wizard'))
  assert.deepEqual(elf.creation?.speciesChoices, { 'elven-lineage': ['Дроу'] })
  assert.equal(elf.creation?.speciesChoices?.['celestial-revelation'], undefined)
  assert.equal(elf.progression?.history?.length, 1, 'changing species must preserve level-up history')

  const soldier = applyCharacterCreation(elf, modernPayload(elf, 'elf', 'soldier-2024', 'wizard'))
  assert.equal(soldier.origin.featId, getRules2024Background('soldier-2024')!.originFeatId)
  assert.equal(soldier.skills.find((skill) => skill.id === 'arcana')?.proficiencySources?.includes('background'), false)
  assert.equal(soldier.progression?.history?.length, 1, 'changing background must preserve level-up history')

  const fighter = applyCharacterCreation(soldier, modernPayload(soldier, 'elf', 'soldier-2024', 'fighter'))
  assert.equal(fighter.spellcasting.spellcastingAbility, null)
  assert.equal(fighter.skills.find((skill) => skill.id === 'arcana')?.proficiencySources?.includes('class'), false)
  assert.equal(fighter.features?.every((id) => id.startsWith('fighter.')), true)
  assert.equal(new Set(fighter.features).size, fighter.features?.length)
  assert.equal(fighter.progression?.history?.length, 1, 'changing class must preserve level-up history')

  const finalAdapter = adapterFor(storage)
  await finalAdapter.load(wizard.id)
  await finalAdapter.save(fighter)
  const reloaded = await adapterFor(storage).load(wizard.id)
  assert.equal(reloaded.progression?.history?.length, 1)
  assert.equal(reloaded.attacks[0]?.attackBonus, '+7')
  assert.equal(reloaded.spells[0]?.description, 'Пользовательское описание заклинания.')
  assert.equal(reloaded.inventoryData.items.some((item) => item.id === 'user:keepsake'), true)
  assert.equal(reloaded.personality.biography, 'История героя сохраняется.')
  assert.deepEqual(validateCharacterV3(JSON.parse(storage.getItem(storageKey(wizard.id))!) as unknown), [])
})

test('2014 racial proficiency does not leak into an unrelated 2024 species', async () => {
  const storage = new MemoryStorage()
  const initial = await loadedMock(storage)
  const elf = applyCharacterCreation(initial, {
    ruleset: '2014', name: initial.name, raceId: 'elf', subraceId: 'high-elf', classId: 'wizard', backgroundId: 'sage',
    subclass: '', alignment: '', baseAbilities: { ...initial.abilities }, classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  assert.deepEqual(elf.skills.find((skill) => skill.id === 'perception')?.proficiencySources, ['race'])
  const human = applyCharacterCreation(elf, modernPayload(elf, 'human', 'soldier-2024', 'fighter'))
  assert.deepEqual(human.skills.find((skill) => skill.id === 'perception')?.proficiencySources, [])
})

test('2024 species with required choices rejects a missing or unknown selection', async () => {
  const initial = await loadedMock(new MemoryStorage())
  const payload = modernPayload(initial, 'aasimar', 'sage-2024', 'wizard')
  assert.throws(() => applyCharacterCreation(initial, { ...payload, speciesChoices: {} }), /выбор|особенность|вид/i)
  assert.throws(() => applyCharacterCreation(initial, { ...payload, speciesChoices: { 'celestial-revelation': ['Неизвестный вариант'] } }), /выбор|особенность|вид/i)
})

test('older creation metadata without equipment IDs does not duplicate generated kits', async () => {
  const storage = new MemoryStorage()
  const initial = await loadedMock(storage)
  const first = applyCharacterCreation(initial, modernPayload(initial, 'human', 'sage-2024', 'wizard'))
  first.inventoryData.items.push({ id: 'user:lantern', name: 'Личная лампа', quantity: 1, weight: null, description: '', equipped: false, properties: [], source: 'user' })
  const adapter = adapterFor(storage)
  await adapter.load(first.id)
  await adapter.save(first)
  const old = JSON.parse(storage.getItem(storageKey(first.id))!) as CharacterV3
  delete (old.extensions.characterCreation as { startingEquipmentIds?: string[] }).startingEquipmentIds
  storage.setItem(storageKey(old.id), JSON.stringify(old))

  const loaded = await adapterFor(storage).load(old.id)
  const changed = applyCharacterCreation(loaded, modernPayload(loaded, 'human', 'sage-2024', 'fighter'))
  const generated = changed.inventoryData.items.filter((item) => item.source === 'creation')
  assert.equal(generated.some((item) => item.id.includes(':class:wizard-')), false)
  assert.equal(new Set(generated.map((item) => item.id)).size, generated.length)
  assert.equal(changed.inventoryData.items.some((item) => item.id === 'user:lantern'), true)
})

test('new sourced skills show their computed bonus while explicit manual entries remain manual', async () => {
  const initial = await loadedMock(new MemoryStorage())
  const manual = initial.skills.find((skill) => skill.id === 'athletics')!
  manual.calculationMode = 'manual'
  manual.value = 7
  const created = applyCharacterCreation(initial, modernPayload(initial, 'human', 'sage-2024', 'wizard'))
  assert.equal(created.skills.find((skill) => skill.id === 'arcana')?.calculationMode, 'computed')
  assert.equal(created.skills.find((skill) => skill.id === 'athletics')?.calculationMode, 'manual')
  assert.equal(created.skills.find((skill) => skill.id === 'athletics')?.value, 7)
})

test('legacy v3 and corrupted or unknown catalog data are handled without overwriting storage', async () => {
  const storage = new MemoryStorage()
  const old = migrateCharacterV2ToV3(createMockCharacter())
  delete old.progression
  delete old.features
  const oldAttacks = JSON.stringify(old.attacks)
  const oldSpells = JSON.stringify(old.spellcasting.knownSpells)
  const oldInventory = JSON.stringify(old.inventory)
  storage.setItem(storageKey(old.id), JSON.stringify(old))
  const adapter = adapterFor(storage)
  const loaded = await adapter.load(old.id)
  assert.equal(loaded.ruleset, '2014')
  await adapter.save(loaded)
  const reloaded = JSON.parse(storage.getItem(storageKey(old.id))!) as CharacterV3
  assert.equal(JSON.stringify(reloaded.attacks), oldAttacks)
  assert.equal(JSON.stringify(reloaded.spellcasting.knownSpells), oldSpells)
  assert.equal(JSON.stringify(reloaded.inventory), oldInventory)
  assert.deepEqual(validateCharacterV3(reloaded), [])

  const unknown = migrateCharacterToV3(reloaded)
  unknown.ruleset = '2024'
  unknown.extensions.characterCreation = { speciesId: 'missing-species' }
  assert.notDeepEqual(validateCharacterV3(unknown), [])
  assert.throws(() => migrateCharacterToV3(unknown))

  const corrupt = '{not valid JSON'
  storage.setItem(storageKey(old.id), corrupt)
  await assert.rejects(adapterFor(storage).load(old.id))
  assert.equal(storage.getItem(storageKey(old.id)), corrupt)
})
