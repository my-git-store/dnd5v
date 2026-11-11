import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import type { AbilityKey } from '@/types/character'

import type { CreationDraft, CreationAbilities } from '../types/characterCreation'

export function useCreationAbilities(draft: CreationDraft): CreationAbilities {
    const { baseAbilities, isCompleted } = draft

    const finalAbility = (key: AbilityKey) => baseAbilities[key]

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
