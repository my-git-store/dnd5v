import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import type { AbilityKey } from '@/types/character'

import type { CreationDraft, CreationOptions, CreationAbilities } from '../types/characterCreation'

export function useCreationAbilities(
    draft: CreationDraft,
    options: CreationOptions,
): CreationAbilities {
    const { ruleset, baseAbilities, raceAbilityChoices, isCompleted } = draft

    const { selectedRace, selectedSubrace } = options

    const finalAbility = (key: AbilityKey) => {
        if (ruleset.value === '2024') return baseAbilities[key]
        return (
            baseAbilities[key] +
            (selectedRace.value.profile.abilityBonuses[key] ?? 0) +
            (selectedSubrace.value?.abilityBonuses[key] ?? 0) +
            (selectedRace.value.abilityChoices && raceAbilityChoices.value.includes(key)
                ? selectedRace.value.abilityChoices.bonus
                : 0)
        )
    }

    const hasAbilityError = computed(() =>
        ABILITY_FIELDS.some(
            field =>
                !Number.isInteger(baseAbilities[field.key]) ||
                baseAbilities[field.key] < 1 ||
                baseAbilities[field.key] > 30,
        ),
    )

    function updateAbility(key: AbilityKey, value: unknown) {
        const parsed = Number(value)
        baseAbilities[key] = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
        isCompleted.value = false
    }
    return { finalAbility, hasAbilityError, updateAbility }
}
