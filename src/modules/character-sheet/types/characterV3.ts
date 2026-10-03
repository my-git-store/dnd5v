import type { AbilityKey, AttackBonusSource, CharacterAbilities, CharacterMoney, SkillProficiency } from './character.ts'

export type CharacterSchemaV3 = 3
export type CharacterCalculationMode = 'manual' | 'computed'
export type SkillProficiencySource = 'race' | 'class' | 'background' | 'manual'
export type CharacterV3SpellLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface RaceProfileV3 {
  name: string
  subrace: string
  size: string
  speed: number
  abilityBonuses: Partial<Record<AbilityKey, number>>
  traits: string[]
  languages: string[]
}

export interface BackgroundProfileV3 {
  name: string
  feature: string
  skillProficiencies: string[]
  toolProficiencies: string[]
  languages: string[]
  notes: string
}

export interface CharacterIdentityV3 {
  name: string
  race: RaceProfileV3
  class: string
  subclass: string
  level: number
  experience: number
  background: BackgroundProfileV3
  alignment: string
}

export interface CharacterProficiencyV3 {
  toolProficiencies: string[]
  languageProficiencies: string[]
}

export interface CharacterSavingThrowV3 {
  proficient: boolean
  additionalBonus: number
}

export type CharacterSavingThrowsV3 = Record<AbilityKey, CharacterSavingThrowV3>

export interface CharacterArmorClassV3 {
  mode: CharacterCalculationMode
  value: number
  armorBase: number | null
  armorDexCap: number | null
  shieldBonus: number
  additionalBonus: number
}

export interface CharacterCombatV3 {
  armorClass: CharacterArmorClassV3
  initiative: { additionalBonus: number }
  speed: { base: number; fly: number | null; swim: number | null; override: number | null }
  hitPoints: { max: number; current: number; temporary: number }
  hitDice: { size: string; total: number; spent: number }
  deathSaves: { successes: number; failures: number }
}

export interface CharacterSkillV3 {
  id: string
  name: string
  value: number
  ability: AbilityKey | null
  proficiency: SkillProficiency
  calculationMode: CharacterCalculationMode
  additionalBonus: number
  proficiencySources?: SkillProficiencySource[]
}

export interface CharacterAttackV3 {
  id: string
  name: string
  kind: 'melee' | 'ranged' | 'spell' | 'other'
  abilitySource: AttackBonusSource
  proficient: boolean
  attackBonus: string
  calculationMode: CharacterCalculationMode
  additionalBonus: number
  damage: string
  damageType: string
  properties: string[]
  range: string
  description: string
}

export interface CharacterSpellV3 {
  id: string
  name: string
  level: number
  description: string
  school: string
  castingTime: string
  range: string
  components: string
  duration: string
  concentration: boolean
  ritual: boolean
}

export interface CharacterSpellSlotV3 {
  max: number
  used: number
}

export type CharacterSpellSlotsV3 = Record<CharacterV3SpellLevel, CharacterSpellSlotV3>

export interface CharacterSpellcastingV3 {
  spellcastingAbility: AbilityKey | null
  knownSpells: CharacterSpellV3[]
  preparedSpellIds: string[]
  cantrips: CharacterSpellV3[]
  spellSlots: CharacterSpellSlotsV3
}

export interface CharacterInventoryItemV3 {
  id: string
  name: string
  quantity: number
  weight: number | null
  description: string
  equipped: boolean
  properties: string[]
  /** Optional marker for items created by the character creation flow. */
  source?: 'creation' | 'user'
}

export interface CharacterInventoryV3 {
  items: CharacterInventoryItemV3[]
  money: CharacterMoney
}

export interface CharacterPersonalityV3 {
  traits: string
  ideals: string
  bonds: string
  flaws: string
  biography: string
  features: string
}

export interface CharacterCreationV3 {
  raceId: string
  classId: string
  baseAbilityScores: CharacterAbilities
  raceSkillIds?: string[]
  raceAbilityChoices?: AbilityKey[]
  classSkillIds: string[]
  classSavingThrowKeys: AbilityKey[]
  manualSavingThrowKeys?: AbilityKey[]
  classFeatures: string[]
  raceFeatures: string[]
  classProficiencies: string[]
  raceLanguages?: string[]
  subraceId?: string
  subraceFeatures?: string[]
  subraceSkillIds?: string[]
  subraceLanguages?: string[]
  backgroundId?: string
  backgroundSkillIds?: string[]
  backgroundToolProficiencies?: string[]
  backgroundLanguages?: string[]
  classEquipmentId?: string
  backgroundEquipmentId?: string
  startingEquipmentIds?: string[]
}

export interface CharacterV3 {
  id: string
  schemaVersion: CharacterSchemaV3
  identity: CharacterIdentityV3
  abilities: CharacterAbilities
  proficiency: CharacterProficiencyV3
  savingThrows: CharacterSavingThrowsV3
  combat: CharacterCombatV3
  skills: CharacterSkillV3[]
  attacks: CharacterAttackV3[]
  spellcasting: CharacterSpellcastingV3
  inventory: CharacterInventoryV3
  personality: CharacterPersonalityV3
  extensions: Record<string, unknown>
}

export function cloneCharacterV3(character: CharacterV3): CharacterV3 {
  return JSON.parse(JSON.stringify(character)) as CharacterV3
}
