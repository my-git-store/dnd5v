import { readStoredCharacterV3WithSource, writeStoredCharacterV3, type CharacterStorageLike } from '../api/characterV3Storage.ts'
import { migrateCharacterV2ToV3 } from '../migration/characterMigrationV3.ts'
import type { Character, CharacterSpell } from '../types/character.ts'
import { cloneCharacterV3, type CharacterAttackV3, type CharacterCreationV3, type CharacterSkillV3, type CharacterSpellV3, type CharacterV3, type SkillProficiencySource } from '../types/characterV3.ts'
import type { CharacterSheetView } from '../types/characterView.ts'

export interface CharacterSheetAdapterOptions {
  storage?: CharacterStorageLike
  loadLegacy?: (id: string) => Promise<Character>
}

export interface CharacterSheetAdapter {
  load(id: string): Promise<CharacterSheetView>
  save(character: CharacterSheetView): Promise<CharacterSheetView>
}

async function loadLegacyCharacter(id: string): Promise<Character> {
  const module = await import('../api/characterApi.ts')
  return module.getCharacter(id)
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toUiSpell(spell: CharacterSpellV3): CharacterSpell {
  return { id: spell.id, name: spell.name, level: spell.level, description: spell.description }
}

function toUiCreation(value: CharacterV3): CharacterCreationV3 | undefined {
  const creation = value.extensions.characterCreation
  if (!creation || typeof creation !== 'object') return undefined
  const source = clone(creation as CharacterCreationV3)
  if (typeof source.raceId !== 'string' || typeof source.classId !== 'string' || !source.baseAbilityScores
    || !Array.isArray(source.classSkillIds) || !Array.isArray(source.classSavingThrowKeys)
    || !Object.values(source.baseAbilityScores).every((score) => typeof score === 'number' && Number.isFinite(score))) return undefined
  return {
    ...source,
    raceSkillIds: source.raceSkillIds ?? [],
    raceAbilityChoices: source.raceAbilityChoices ?? [],
    manualSavingThrowKeys: source.manualSavingThrowKeys ?? [],
    raceLanguages: source.raceLanguages ?? [],
    subraceSkillIds: source.subraceSkillIds ?? [],
    subraceLanguages: source.subraceLanguages ?? [],
    backgroundSkillIds: source.backgroundSkillIds ?? [],
    backgroundToolProficiencies: source.backgroundToolProficiencies ?? [],
    backgroundLanguages: source.backgroundLanguages ?? [],
    startingEquipmentIds: source.startingEquipmentIds ?? [],
  }
}

function skillSources(skill: CharacterSkillV3, value: CharacterV3): SkillProficiencySource[] | undefined {
  if (skill.proficiencySources) return [...skill.proficiencySources]
  if (skill.proficiency === 'none') return []
  const creation = toUiCreation(value)
  const sources: SkillProficiencySource[] = []
  if (creation?.classSkillIds.includes(skill.id)) sources.push('class')
  if (creation?.raceSkillIds?.includes(skill.id) || creation?.subraceSkillIds?.includes(skill.id)) sources.push('race')
  if (creation?.backgroundSkillIds?.includes(skill.id) || value.identity.background.skillProficiencies.includes(skill.id)) sources.push('background')
  if (!sources.length) sources.push('manual')
  return sources
}

function toUiCharacter(value: CharacterV3): CharacterSheetView {
  return {
    id: value.id,
    schemaVersion: 2,
    name: value.identity.name,
    class: value.identity.class,
    level: value.identity.level,
    experience: value.identity.experience,
    armorClass: value.combat.armorClass.value,
    combat: clone(value.combat),
    spellcasting: clone(value.spellcasting),
    abilities: clone(value.abilities),
    skills: value.skills.map((skill) => ({ id: skill.id, name: skill.name, value: skill.value, ability: skill.ability, proficiency: skill.proficiency, calculationMode: skill.calculationMode, additionalBonus: skill.additionalBonus, proficiencySources: skillSources(skill, value) })),
    attacks: value.attacks.map((attack) => ({ id: attack.id, name: attack.name, kind: attack.kind, attackBonus: attack.attackBonus, bonusSource: attack.abilitySource, proficient: attack.proficient, calculationMode: attack.calculationMode, additionalBonus: attack.additionalBonus, damage: attack.damage, damageType: attack.damageType, properties: clone(attack.properties), range: attack.range, description: attack.description })),
    spells: value.spellcasting.knownSpells.map(toUiSpell),
    cantrips: value.spellcasting.cantrips.map(toUiSpell),
    inventory: value.inventory.items.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, description: item.description })),
    inventoryData: clone(value.inventory),
    money: clone(value.inventory.money),
    bio: { biography: value.personality.biography, traits: value.personality.traits, features: value.personality.features },
    personality: clone(value.personality),
    race: clone(value.identity.race),
    subclass: value.identity.subclass,
    background: clone(value.identity.background),
    alignment: value.identity.alignment,
    savingThrows: clone(value.savingThrows),
    proficiency: clone(value.proficiency),
    creation: toUiCreation(value),
  }
}

function mergeSkill(skill: CharacterSheetView['skills'][number], stored: CharacterSkillV3 | undefined): CharacterSkillV3 {
  const proficiencySources = skill.proficiencySources ? [...skill.proficiencySources] : undefined
  return stored
    ? { ...clone(stored), id: skill.id, name: skill.name, value: skill.value, ability: skill.ability, proficiency: skill.proficiency, calculationMode: skill.calculationMode, additionalBonus: skill.additionalBonus, ...(proficiencySources === undefined ? {} : { proficiencySources }) }
    : { id: skill.id, name: skill.name, value: skill.value, ability: skill.ability, proficiency: skill.proficiency, calculationMode: skill.calculationMode, additionalBonus: skill.additionalBonus, ...(proficiencySources === undefined ? {} : { proficiencySources }) }
}

function mergeAttack(attack: CharacterSheetView['attacks'][number], stored: CharacterAttackV3 | undefined): CharacterAttackV3 {
  const { bonusSource, ...fields } = clone(attack)
  return { ...(stored ? clone(stored) : {}), ...fields, abilitySource: bonusSource }
}

function mergeSpell(spell: CharacterSpell, stored: CharacterSpellV3 | undefined): CharacterSpellV3 {
  return stored
    ? { ...clone(stored), id: spell.id, name: spell.name, level: spell.level, description: spell.description }
    : { id: spell.id, name: spell.name, level: spell.level, description: spell.description, school: '', castingTime: '', range: '', components: '', duration: '', concentration: false, ritual: false }
}

function mergeItem(item: CharacterSheetView['inventoryData']['items'][number], stored: CharacterV3['inventory']['items'][number] | undefined): CharacterV3['inventory']['items'][number] {
  return stored
    ? { ...clone(stored), ...clone(item), properties: clone(item.properties) }
    : clone(item)
}

function mergePersonality(value: CharacterSheetView, base: CharacterV3): CharacterV3['personality'] {
  const next = clone(value.personality)
  const legacyFields: Array<keyof CharacterSheetView['bio']> = ['biography', 'traits', 'features']
  for (const field of legacyFields) {
    const v3Changed = value.personality[field] !== base.personality[field]
    const legacyChanged = value.bio[field] !== base.personality[field]
    if (!v3Changed && legacyChanged) next[field] = value.bio[field]
  }
  return next
}

function mergeMoney(value: CharacterSheetView, base: CharacterV3): CharacterV3['inventory']['money'] {
  const next = clone(value.inventoryData.money)
  const fields: Array<keyof CharacterSheetView['money']> = ['copper', 'silver', 'electrum', 'gold', 'platinum']
  for (const field of fields) {
    const v3Changed = value.inventoryData.money[field] !== base.inventory.money[field]
    const legacyChanged = value.money[field] !== base.inventory.money[field]
    if (!v3Changed && legacyChanged) next[field] = value.money[field]
  }
  return next
}

function toV3(value: CharacterSheetView, base: CharacterV3): CharacterV3 {
  const next = cloneCharacterV3(base)
  next.identity.name = value.name
  next.identity.class = value.class
  next.identity.race = clone(value.race)
  next.identity.subclass = value.subclass
  next.identity.level = value.level
  next.identity.experience = value.experience
  next.identity.background = clone(value.background)
  next.identity.alignment = value.alignment
  next.proficiency = clone(value.proficiency)
  next.combat = clone(value.combat)
  next.spellcasting = clone(value.spellcasting)
  next.abilities = clone(value.abilities)
  next.skills = value.skills.map((skill) => mergeSkill(skill, base.skills.find((item) => item.id === skill.id)))
  next.attacks = value.attacks.map((attack) => mergeAttack(attack, base.attacks.find((item) => item.id === attack.id)))
  next.spellcasting.knownSpells = value.spells.map((spell) => mergeSpell(spell, base.spellcasting.knownSpells.find((item) => item.id === spell.id)))
  next.spellcasting.cantrips = value.cantrips.map((spell) => mergeSpell(spell, base.spellcasting.cantrips.find((item) => item.id === spell.id)))
  const knownSpellIds = new Set(next.spellcasting.knownSpells.map((spell) => spell.id))
  next.spellcasting.preparedSpellIds = next.spellcasting.preparedSpellIds.filter((id) => knownSpellIds.has(id))
  next.inventory = clone(value.inventoryData)
  next.inventory.items = value.inventoryData.items.map((item) => mergeItem(item, base.inventory.items.find((stored) => stored.id === item.id)))
  next.inventory.money = mergeMoney(value, base)
  next.personality = mergePersonality(value, base)
  next.savingThrows = clone(value.savingThrows)
  if (value.creation) next.extensions.characterCreation = clone(value.creation)
  return next
}

export function createCharacterSheetAdapter(options: CharacterSheetAdapterOptions = {}): CharacterSheetAdapter {
  const loadLegacy = options.loadLegacy ?? loadLegacyCharacter
  let currentV3: CharacterV3 | null = null

  return {
    async load(id: string): Promise<CharacterSheetView> {
      const stored = readStoredCharacterV3WithSource(id, options.storage)
      if (stored !== null) {
        currentV3 = cloneCharacterV3(stored.character)
        if (stored.source !== 'v3') writeStoredCharacterV3(currentV3, options.storage)
        return toUiCharacter(currentV3)
      }

      const legacy = await loadLegacy(id)
      currentV3 = migrateCharacterV2ToV3(legacy)
      return toUiCharacter(currentV3)
    },

    async save(character: CharacterSheetView): Promise<CharacterSheetView> {
      const base = currentV3 ?? migrateCharacterV2ToV3(character)
      const next = toV3(character, base)
      const saved = writeStoredCharacterV3(next, options.storage)
      currentV3 = cloneCharacterV3(saved)
      return toUiCharacter(saved)
    },
  }
}

export const characterSheetAdapter = createCharacterSheetAdapter()
