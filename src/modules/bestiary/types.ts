import type { AbilityKey, CharacterAbilities } from '../character-sheet/types/character.ts'
import type { CharacterNpcBonusV3, CharacterNpcEntryV3, CharacterNpcV3 } from '../character-sheet/types/characterV3.ts'

export type BestiarySize = 'Крошечный' | 'Маленький' | 'Средний' | 'Большой' | 'Огромный'

export interface BestiaryEntry {
  id: string
  name: string
  size: BestiarySize
  creatureType: string
  alignment: string
  challengeRating: string
  proficiencyBonus: number
  environment: string[]
  source: string
  languages: string[]
  speed: number
  armorClass: number
  hitPoints: number
  initiative: number
  abilities: CharacterAbilities
  savingThrows: CharacterNpcBonusV3[]
  skills: CharacterNpcBonusV3[]
  senses: string
  features: CharacterNpcEntryV3[]
  actions: CharacterNpcEntryV3[]
  reactions: CharacterNpcEntryV3[]
  legendaryActions: CharacterNpcEntryV3[]
}

export interface BestiaryFilters {
  search: string
  size: string
  creatureType: string
  alignment: string
  challengeRating: string
  environment: string
  source: string
  language: string
  speed: string
}

export type BestiarySort = 'name' | 'challengeRating' | 'speed'

export function bestiaryAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function bestiaryToNpc(entry: BestiaryEntry): CharacterNpcV3 {
  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  return {
    name: entry.name,
    creatureType: entry.creatureType,
    size: entry.size,
    alignment: entry.alignment,
    challengeRating: entry.challengeRating,
    proficiencyBonus: entry.proficiencyBonus,
    armorClass: { mode: 'manual', value: entry.armorClass, additionalBonus: 0 },
    hitPoints: { max: entry.hitPoints, current: entry.hitPoints, temporary: 0 },
    speed: entry.speed,
    initiative: { mode: 'manual', additionalBonus: 0, value: entry.initiative },
    senses: entry.senses,
    languages: entry.languages.join(', '),
    abilities: clone(entry.abilities),
    skills: clone(entry.skills),
    savingThrows: clone(entry.savingThrows),
    features: clone(entry.features),
    actions: clone(entry.actions),
  }
}

export function bestiaryInitiativeParticipant(entry: BestiaryEntry): { id: string; name: string; initiative: number; hitPoints: number; armorClass: number } {
  return { id: `bestiary-${entry.id}`, name: entry.name, initiative: entry.initiative, hitPoints: entry.hitPoints, armorClass: entry.armorClass }
}

export const BESTIARY_ABILITY_KEYS: readonly AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
