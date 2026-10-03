import { nullableAbilityModifier } from './abilityModifier.ts'
import { proficiencyBonus } from './proficiencyBonus.ts'
import type { AbilityKey, CharacterAbilities } from '../types/character.ts'

export interface SavingThrowBonusInput {
  ability: AbilityKey | null
  proficient: boolean
  additionalBonus?: number
}

export function calculateSavingThrowBonus(
  input: SavingThrowBonusInput,
  abilities: Partial<CharacterAbilities>,
  level: unknown,
): number | null {
  if (input.ability === null) return null
  const modifier = nullableAbilityModifier(abilities[input.ability])
  if (modifier === null) return null

  const proficiency = input.proficient ? proficiencyBonus(level) : 0
  if (proficiency === null) return null
  const additionalBonus = typeof input.additionalBonus === 'number' && Number.isFinite(input.additionalBonus)
    ? Math.trunc(input.additionalBonus)
    : 0
  return modifier + proficiency + additionalBonus
}
