import type { Monster, MonsterAbilityScore, MonsterSkillRecord } from '../types/monster'

export function abilityModifier(score: number): number {
    return Math.floor((score - 10) / 2)
}

export function signedModifier(value: number): string {
    return value >= 0 ? `+${value}` : String(value)
}

function proficiencyBonus(level: string): number | null {
    const numericLevel = Number(level)

    if (!Number.isInteger(numericLevel) || numericLevel < 1 || numericLevel > 20) return null
    return 2 + Math.floor((numericLevel - 1) / 4)
}

export function calculateSavingThrowBonus(
    ability: MonsterAbilityScore,
    level: string,
): number | null {
    const proficiency = ability.proficient ? proficiencyBonus(level) : 0

    if (!Number.isFinite(ability.score) || proficiency === null) return null
    return abilityModifier(ability.score) + proficiency
}

export function calculateSkillBonus(
    skill: MonsterSkillRecord,
    abilities: Monster['abilityScores'],
    level: string,
): number | null {
    if (skill.calculationMode === 'manual') {
        return Number.isFinite(skill.value) ? skill.value : null
    }

    if (skill.ability === null) return null

    const score = abilities[skill.ability].score

    const proficiency = skill.proficiency === 'none' ? 0 : proficiencyBonus(level)

    if (!Number.isFinite(score) || proficiency === null) return null

    const proficiencyContribution =
        skill.proficiency === 'expertise' ? proficiency * 2 : proficiency

    const additionalBonus = Number.isFinite(skill.additionalBonus)
        ? Math.trunc(skill.additionalBonus)
        : 0

    return abilityModifier(score) + proficiencyContribution + additionalBonus
}
