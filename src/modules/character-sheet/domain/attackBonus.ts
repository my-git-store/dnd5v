import { abilityModifier, signedModifier } from './abilityModifier.ts'
import { proficiencyBonus } from './proficiencyBonus.ts'
import type { CharacterAbilities, CharacterAttack, AttackBonusSource } from '../types/character'

export type AttackCalculationMode = 'manual' | 'computed'

export interface AttackBonusInput {
  attackBonus?: unknown
  bonusSource?: unknown
  abilitySource?: unknown
  additionalBonus?: unknown
  proficient?: unknown
  calculationMode?: unknown
}

const ABILITY_KEYS: readonly AttackBonusSource[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
]

export function isAttackBonusSource(value: unknown): value is AttackBonusSource {
  return value === 'manual' || ABILITY_KEYS.includes(value as AttackBonusSource)
}

export function getAttackBonusSource(attack: AttackBonusInput): AttackBonusSource {
  const source = 'abilitySource' in attack ? attack.abilitySource : attack.bonusSource
  return isAttackBonusSource(source) ? source : 'manual'
}

export function getAdditionalAttackBonus(attack: AttackBonusInput): number {
  const value = Number(attack.additionalBonus)
  return Number.isFinite(value) ? Math.trunc(value) : 0
}

export function getAttackCalculationMode(attack: AttackBonusInput): AttackCalculationMode {
  if (attack.calculationMode === 'manual') return 'manual'
  if (attack.calculationMode === 'computed') return 'computed'
  const source = 'abilitySource' in attack ? attack.abilitySource : attack.bonusSource
  return isAttackBonusSource(source) && source !== 'manual' ? 'computed' : 'manual'
}

export function calculateAttackBonus(
  attack: AttackBonusInput,
  abilities: Partial<CharacterAbilities>,
  level: unknown,
): number | null {
  if (getAttackCalculationMode(attack) === 'manual') return null
  const source = 'abilitySource' in attack ? attack.abilitySource : attack.bonusSource
  if (!isAttackBonusSource(source) || source === 'manual') return null
  const value = abilities[source]
  if (typeof value !== 'number' || !Number.isFinite(value)) return null

  let total = abilityModifier(value) + getAdditionalAttackBonus(attack)
  if (attack.proficient === true) {
    const proficiency = proficiencyBonus(level)
    if (proficiency === null) return null
    total += proficiency
  }
  return total
}

export function formatAttackBonus(attack: CharacterAttack, abilities: CharacterAbilities, level = 1): string {
  const source = getAttackBonusSource(attack)
  const additionalBonus = getAdditionalAttackBonus(attack)
  if (getAttackCalculationMode(attack) === 'manual' || source === 'manual') {
    const manualBonus = typeof attack.attackBonus === 'string' ? attack.attackBonus : ''
    return additionalBonus === 0 ? manualBonus : `${manualBonus} ${signedModifier(additionalBonus)}`
  }
  const calculated = calculateAttackBonus(attack, abilities, level)
  return calculated === null ? '—' : signedModifier(calculated)
}
