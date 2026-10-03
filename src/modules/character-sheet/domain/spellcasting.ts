import { nullableAbilityModifier } from './abilityModifier.ts'
import { proficiencyBonus } from './proficiencyBonus.ts'
import type { AbilityKey, CharacterAbilities } from '../types/character.ts'

function spellcastingModifier(
  ability: AbilityKey | null | undefined,
  abilities: Partial<CharacterAbilities>,
): number | null {
  if (ability === null || ability === undefined) return null
  return nullableAbilityModifier(abilities[ability])
}

export function calculateSpellSaveDc(
  spellcastingAbility: AbilityKey | null | undefined,
  abilities: Partial<CharacterAbilities>,
  level: unknown,
): number | null {
  const modifier = spellcastingModifier(spellcastingAbility, abilities)
  const proficiency = proficiencyBonus(level)
  if (modifier === null || proficiency === null) return null
  return 8 + proficiency + modifier
}

export function calculateSpellAttackBonus(
  spellcastingAbility: AbilityKey | null | undefined,
  abilities: Partial<CharacterAbilities>,
  level: unknown,
): number | null {
  const modifier = spellcastingModifier(spellcastingAbility, abilities)
  const proficiency = proficiencyBonus(level)
  if (modifier === null || proficiency === null) return null
  return proficiency + modifier
}
