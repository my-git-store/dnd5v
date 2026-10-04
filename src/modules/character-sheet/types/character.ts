export type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma'

export type CharacterAbilities = Record<AbilityKey, number>
export type AttackBonusSource = AbilityKey | 'manual'
export type SkillProficiency = 'none' | 'proficient' | 'expertise'

export interface CharacterSkill {
  id: string
  name: string
  value: number
  ability: AbilityKey | null
  proficiency: SkillProficiency
}

export interface CharacterAttack {
  id: string
  name: string
  attackBonus: string
  bonusSource: AttackBonusSource
  additionalBonus: number
  damage: string
  description: string
}

export interface CharacterSpell {
  id: string
  name: string
  level: number
  description: string
  /** Optional catalog metadata; legacy spell records may omit these fields. */
  school?: string
  classes?: string[]
  metadata?: Record<string, unknown>
}

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  description: string
}

export interface CharacterMoney {
  copper: number
  silver: number
  electrum: number
  gold: number
  platinum: number
}

export interface CharacterBio {
  biography: string
  traits: string
  features: string
}

export interface Character {
  id: string
  schemaVersion: 2
  name: string
  class: string
  level: number
  experience: number
  armorClass: number
  abilities: CharacterAbilities
  skills: CharacterSkill[]
  attacks: CharacterAttack[]
  spells: CharacterSpell[]
  cantrips: CharacterSpell[]
  inventory: InventoryItem[]
  money: CharacterMoney
  bio: CharacterBio
}

export type CharacterV1 = Omit<Character, 'schemaVersion' | 'skills' | 'attacks'> & {
  schemaVersion: 1
  skills: Array<Pick<CharacterSkill, 'id' | 'name' | 'value'>>
  attacks: Array<Omit<CharacterAttack, 'bonusSource' | 'additionalBonus'> & Partial<Pick<CharacterAttack, 'bonusSource' | 'additionalBonus'>>>
}

export type CharacterDetails = Pick<Character, 'class' | 'level' | 'experience' | 'armorClass'>

export type CharacterCollection = 'attacks' | 'spells' | 'cantrips' | 'inventory'

export function cloneCharacter(character: Character): Character {
  return JSON.parse(JSON.stringify(character)) as Character
}
