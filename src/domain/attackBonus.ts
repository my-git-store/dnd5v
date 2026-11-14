import { nullableAbilityModifier, signedModifier } from './abilityModifier.ts'
import { proficiencyBonus } from './proficiencyBonus.ts'
import type { CharacterAbilities, CharacterAttackRecord } from '../types/character'

export interface AttackBonusInput extends Pick<CharacterAttackRecord, 'ability'> {
    additionalBonus?: unknown
    proficient?: unknown
}

export function getAdditionalAttackBonus(attack: Pick<AttackBonusInput, 'additionalBonus'>): number {
    const value = Number(attack.additionalBonus)
    return Number.isFinite(value) ? Math.trunc(value) : 0
}

export function calculateAttackBonus(
    attack: AttackBonusInput,
    abilities: Partial<CharacterAbilities>,
    level: unknown,
): number | null {
    let total = getAdditionalAttackBonus(attack)
    if (attack.ability !== null) {
        const modifier = nullableAbilityModifier(abilities[attack.ability])
        if (modifier === null) return null
        total += modifier
    }
    if (attack.proficient === true) {
        const proficiency = proficiencyBonus(level)
        if (proficiency === null) return null
        total += proficiency
    }
    return total
}

export function formatAttackBonus(
    attack: CharacterAttackRecord,
    abilities: CharacterAbilities,
    level = 1,
): string {
    const calculated = calculateAttackBonus(attack, abilities, level)
    return calculated === null ? '—' : signedModifier(calculated)
}
