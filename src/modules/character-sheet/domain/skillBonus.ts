import { nullableAbilityModifier } from './abilityModifier.ts'
import { proficiencyBonus } from './proficiencyBonus.ts'
import type { AbilityKey, CharacterAbilities, CharacterSkill, SkillProficiency } from '../types/character.ts'

export type CalculationMode = 'manual' | 'computed'

export interface SkillBonusInput extends Pick<CharacterSkill, 'ability' | 'proficiency' | 'value'> {
  calculationMode?: CalculationMode
  additionalBonus?: number
}

function isAbilityKey(value: AbilityKey | null): value is AbilityKey {
  return value !== null
}

function normalizeAdditionalBonus(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : 0
}

function proficiencyContribution(value: SkillProficiency, level: unknown): number | null {
  if (value === 'none') return 0
  const bonus = proficiencyBonus(level)
  if (bonus === null) return null
  return value === 'expertise' ? bonus * 2 : bonus
}

export function getSkillCalculationMode(skill: Pick<SkillBonusInput, 'calculationMode'>): CalculationMode {
  // New and migrated skills calculate from their linked ability by default.
  // Manual mode remains explicit so existing custom bonuses keep working.
  return skill.calculationMode === 'manual' ? 'manual' : 'computed'
}

export function calculateSkillBonus(
  skill: SkillBonusInput,
  abilities: Partial<CharacterAbilities>,
  level: unknown,
): number | null {
  if (getSkillCalculationMode(skill) === 'manual') {
    return typeof skill.value === 'number' && Number.isFinite(skill.value) ? skill.value : null
  }

  if (!isAbilityKey(skill.ability)) return null
  const modifier = nullableAbilityModifier(abilities[skill.ability])
  if (modifier === null) return null
  const proficiency = proficiencyContribution(skill.proficiency, level)
  if (proficiency === null) return null
  return modifier + proficiency + normalizeAdditionalBonus(skill.additionalBonus)
}
