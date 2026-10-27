import { abilityModifier } from './abilityModifier.ts'
import type { CharacterAbilities } from '../types/character.ts'

export function calculateInitiative(abilities: Partial<CharacterAbilities>, additionalBonus: unknown): number | null {
  const dexterity = abilities.dexterity
  if (typeof dexterity !== 'number' || !Number.isFinite(dexterity)) return null
  const bonus = Number(additionalBonus)
  return abilityModifier(dexterity) + (Number.isFinite(bonus) ? Math.trunc(bonus) : 0)
}
