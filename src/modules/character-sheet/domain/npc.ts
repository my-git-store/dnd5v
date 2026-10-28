import type { CharacterAbilities } from '../types/character.ts'
import type { CharacterNpcV3 } from '../types/characterV3.ts'

export const DEFAULT_NPC_ABILITIES: CharacterAbilities = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }

export function createDefaultNpcProfile(name = 'Новый НПС'): CharacterNpcV3 {
  return {
    name,
    creatureType: 'Гуманоид',
    size: 'Средний',
    alignment: 'Не указано',
    challengeRating: '0',
    proficiencyBonus: 2,
    armorClass: { mode: 'manual', value: 10, additionalBonus: 0 },
    hitPoints: { max: 1, current: 1, temporary: 0 },
    speed: 30,
    initiative: { mode: 'computed', additionalBonus: 0, value: 0 },
    senses: '',
    languages: '',
    abilities: { ...DEFAULT_NPC_ABILITIES },
    skills: [],
    savingThrows: [],
    features: [],
    actions: [],
  }
}
