import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

test('applies PHB race/class selections without discarding existing collections', () => {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  const view = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => createMockCharacter() })
  return view.load(source.id).then((loaded) => {
    const next = applyCharacterCreation(loaded, {
      name: 'Тестовый герой', raceId: 'dwarf', classId: 'rogue', subclass: '', alignment: '',
      baseAbilities: { strength: 10, dexterity: 15, constitution: 12, intelligence: 13, wisdom: 10, charisma: 8 },
      classSkillIds: ['stealth', 'sleight-of-hand', 'investigation', 'perception'], raceSkillChoices: [], raceAbilityChoices: [],
    })
    assert.equal(next.name, 'Тестовый герой')
    assert.equal(next.class, 'Плут')
    assert.equal(next.race.name, 'Дварф')
    assert.equal(next.abilities.constitution, 14)
    assert.equal(next.skills.find((skill) => skill.id === 'stealth')?.proficiency, 'proficient')
    assert.equal(next.skills.find((skill) => skill.id === 'athletics')?.proficiency, 'none')
    assert.equal(next.attacks.length, loaded.attacks.length)
    assert.equal(next.inventoryData.items.length, loaded.inventoryData.items.length)
    assert.deepEqual(next.creation?.classSavingThrowKeys, ['dexterity', 'intelligence'])
  })
})

test('caps class skill selections at the class rule limit', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const next = applyCharacterCreation(loaded, {
    name: loaded.name, raceId: 'human', classId: 'fighter', subclass: '', alignment: '',
    baseAbilities: loaded.abilities, classSkillIds: ['athletics', 'survival', 'perception', 'history'], raceAbilityChoices: [],
  })
  assert.deepEqual(next.creation?.classSkillIds, ['athletics', 'survival'])
  assert.equal(next.skills.find((skill) => skill.id === 'perception')?.proficiency, 'none')
})

test('persists creation metadata through the existing v3 adapter', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const created = applyCharacterCreation(loaded, {
    name: 'Гном-волшебник', raceId: 'gnome', classId: 'wizard', subclass: '', alignment: '',
    baseAbilities: { strength: 8, dexterity: 12, constitution: 12, intelligence: 15, wisdom: 13, charisma: 10 },
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  await adapter.save(created)
  const raw = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as { extensions: { characterCreation: { classId: string } }; proficiency: { languageProficiencies: string[] } }
  assert.equal(raw.extensions.characterCreation.classId, 'wizard')
  assert.ok(raw.proficiency.languageProficiencies.includes('Гномий'))
})

test('changing race replaces deterministic bonuses and preserves the base scores', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const base = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
  const dwarf = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'dwarf', classId: 'fighter', subclass: '', alignment: '', baseAbilities: base, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  const elf = applyCharacterCreation(dwarf, { name: loaded.name, raceId: 'elf', classId: 'fighter', subclass: '', alignment: '', baseAbilities: base, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  const elfAgain = applyCharacterCreation(elf, { name: loaded.name, raceId: 'elf', classId: 'fighter', subclass: '', alignment: '', baseAbilities: base, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  assert.equal(dwarf.abilities.constitution, 12)
  assert.equal(elf.abilities.constitution, 10)
  assert.equal(elf.abilities.dexterity, 12)
  assert.deepEqual(elfAgain.abilities, elf.abilities)
})

test('changing class replaces class sources while retaining race source on the same skill', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const rogue = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'elf', classId: 'rogue', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['stealth', 'perception', 'investigation', 'athletics'], raceAbilityChoices: [] })
  const wizard = applyCharacterCreation(rogue, { name: loaded.name, raceId: 'elf', classId: 'wizard', subclass: '', alignment: '', baseAbilities: rogue.creation!.baseAbilityScores, classSkillIds: ['arcana', 'history'], raceAbilityChoices: [] })
  assert.deepEqual(wizard.skills.find((skill) => skill.id === 'perception')?.proficiencySources, ['race'])
  assert.equal(wizard.skills.find((skill) => skill.id === 'stealth')?.proficiency, 'none')
  assert.equal(wizard.savingThrows.dexterity.proficient, false)
  assert.equal(wizard.savingThrows.intelligence.proficient, true)
  assert.equal(wizard.spellcasting.spellcastingAbility, 'intelligence')
})

test('caster and non-caster changes clear stale spellcasting ability without deleting spells', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const wizard = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'human', classId: 'wizard', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['arcana', 'history'], raceAbilityChoices: [] })
  const fighter = applyCharacterCreation(wizard, { name: loaded.name, raceId: 'human', classId: 'fighter', subclass: '', alignment: '', baseAbilities: wizard.creation!.baseAbilityScores, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  assert.equal(fighter.spellcasting.spellcastingAbility, null)
  assert.equal(fighter.spells.length, wizard.spells.length)
})

test('round-trip keeps old v3 data, manual speed override and creation-independent collections', async () => {
  const storage = new MemoryStorage()
  const source = migrateCharacterV2ToV3(createMockCharacter())
  source.combat.speed.override = 45
  source.attacks[0]!.attackBonus = '1d20+4'
  source.spellcasting.knownSpells[0]!.description = 'Не терять'
  source.inventory.items[0]!.equipped = true
  source.personality.biography = 'Старая биография'
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const loaded = await adapter.load(source.id)
  assert.equal(loaded.creation, undefined)
  const created = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'elf', classId: 'bard', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['performance', 'persuasion', 'insight'], raceAbilityChoices: [] })
  await adapter.save(created)
  const reloaded = await createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } }).load(source.id)
  assert.equal(reloaded.race.name, 'Эльф')
  assert.equal(reloaded.class, 'Бард')
  assert.equal(reloaded.combat.speed.override, 45)
  assert.equal(reloaded.attacks[0]?.attackBonus, '1d20+4')
  assert.equal(reloaded.spells[0]?.description, 'Не терять')
  assert.equal(reloaded.inventoryData.items[0]?.equipped, true)
  assert.equal(reloaded.personality.biography, 'Старая биография')
})

test('applies subrace bonuses and replaces them on subrace change', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const base = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
  const hill = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'dwarf', subraceId: 'hill-dwarf', classId: 'fighter', backgroundId: 'soldier', subclass: '', alignment: '', baseAbilities: base, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  const mountain = applyCharacterCreation(hill, { name: loaded.name, raceId: 'dwarf', subraceId: 'mountain-dwarf', classId: 'fighter', backgroundId: 'soldier', subclass: '', alignment: '', baseAbilities: base, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  assert.equal(hill.abilities.wisdom, 11)
  assert.equal(mountain.abilities.wisdom, 10)
  assert.equal(mountain.abilities.strength, 12)
  assert.equal(mountain.race.subrace, 'Горный дварф')
})

test('tracks background proficiency alongside race and class sources', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const created = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'half-elf', classId: 'rogue', backgroundId: 'criminal', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['deception', 'stealth', 'investigation', 'perception'], raceSkillChoices: ['deception'], raceAbilityChoices: [] })
  assert.deepEqual(created.skills.find((skill) => skill.id === 'deception')?.proficiencySources, ['class', 'race', 'background'])
  assert.equal(created.skills.find((skill) => skill.id === 'deception')?.proficiency, 'proficient')
})

test('changes background sources without removing class or race ownership', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  const criminal = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'half-elf', classId: 'rogue', backgroundId: 'criminal', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['deception', 'stealth', 'investigation', 'perception'], raceSkillChoices: ['deception'], raceAbilityChoices: [] })
  const sage = applyCharacterCreation(criminal, { name: loaded.name, raceId: 'half-elf', classId: 'rogue', backgroundId: 'sage', subclass: '', alignment: '', baseAbilities: criminal.creation!.baseAbilityScores, classSkillIds: ['deception', 'stealth', 'investigation', 'perception'], raceSkillChoices: ['deception'], raceAbilityChoices: [] })
  assert.deepEqual(sage.skills.find((skill) => skill.id === 'deception')?.proficiencySources, ['class', 'race'])
  assert.equal(sage.skills.find((skill) => skill.id === 'arcana')?.proficiencySources?.includes('background'), true)
})

test('starting equipment is deterministic and preserves user items', async () => {
  const source = createMockCharacter()
  const storage = new MemoryStorage()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  loaded.inventoryData.items.push({ id: 'user-item', name: 'Личный амулет', quantity: 1, weight: null, description: 'Не удалять', equipped: false, properties: [] })
  const payload = { name: loaded.name, raceId: 'human', classId: 'fighter', backgroundId: 'soldier', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [], classEquipmentId: 'fighter-sword', backgroundEquipmentId: 'soldier-kit' }
  const first = applyCharacterCreation(loaded, payload)
  const repeated = applyCharacterCreation(first, payload)
  assert.equal(repeated.inventoryData.items.filter((item) => item.source === 'creation').length, first.inventoryData.items.filter((item) => item.source === 'creation').length)
  assert.equal(repeated.inventoryData.items.filter((item) => item.id === 'user-item').length, 1)
  await adapter.save(repeated)
  const reloaded = await createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } }).load(source.id)
  assert.equal(reloaded.inventoryData.items.filter((item) => item.source === 'creation').length, first.inventoryData.items.filter((item) => item.source === 'creation').length)
  assert.equal(reloaded.inventoryData.items.some((item) => item.id === 'user-item'), true)
})

test('legacy creation payload keeps an existing background when no background choice is supplied', async () => {
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage: new MemoryStorage(), loadLegacy: async () => source })
  const loaded = await adapter.load(source.id)
  loaded.background = { name: 'Старый фон', feature: 'Старое умение', skillProficiencies: ['history'], toolProficiencies: ['Старый инструмент'], languages: ['Старый язык'], notes: 'Сохранить' }
  loaded.proficiency.toolProficiencies.push('Старый инструмент')
  loaded.proficiency.languageProficiencies.push('Старый язык')
  const next = applyCharacterCreation(loaded, { name: loaded.name, raceId: 'human', classId: 'fighter', subclass: '', alignment: '', baseAbilities: loaded.abilities, classSkillIds: ['athletics', 'survival'], raceAbilityChoices: [] })
  assert.equal(next.background.name, 'Старый фон')
  assert.equal(next.proficiency.toolProficiencies.includes('Старый инструмент'), true)
  assert.equal(next.proficiency.languageProficiencies.includes('Старый язык'), true)
})
