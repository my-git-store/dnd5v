import { nullableAbilityModifier } from './abilityModifier.ts'
import { proficiencyBonus } from './proficiencyBonus.ts'
import type { AbilityKey, CharacterAbilities } from '../types/character.ts'

export interface SavingThrowBonusInput {
    ability: AbilityKey | null
    proficient: boolean
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
    return modifier + proficiency
}
