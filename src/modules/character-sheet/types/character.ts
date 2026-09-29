export type AbilityKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma'

export type CharacterAbilities = Record<AbilityKey, number>

export interface CharacterSkill {
  id: string
  name: string
  value: number
}

export interface CharacterAttack {
  id: string
  name: string
  attackBonus: string
  damage: string
  description: string
}

export interface CharacterSpell {
  id: string
  name: string
  level: number
  description: string
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
  schemaVersion: 1
  name: string
  abilities: CharacterAbilities
  skills: CharacterSkill[]
  attacks: CharacterAttack[]
  spells: CharacterSpell[]
  cantrips: CharacterSpell[]
  inventory: InventoryItem[]
  money: CharacterMoney
  bio: CharacterBio
}

export type CharacterCollection = 'attacks' | 'spells' | 'cantrips' | 'inventory'

export function cloneCharacter(character: Character): Character {
  return JSON.parse(JSON.stringify(character)) as Character
}
