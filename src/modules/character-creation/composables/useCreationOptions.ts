import { computed } from 'vue'

import {
    RULES_2024_SPECIES,
    RULES_2024_CLASSES,
    RULES_2024_BACKGROUNDS,
    findSpecies2024,
    findRules2024Class,
    findRules2024Background,
} from '@/data/rules2024'
import { speciesIconFor } from '@/data/speciesIcons'
import { backgroundIconFor } from '@/data/backgroundIcons'

import { speciesAsCreation, backgroundAsCreation } from '../utils/creationOptions'
import type {
    CreationDraft,
    CreationOptions,
    CreationBackgroundOption,
    CreationSpeciesOption,
} from '../types/characterCreation'

export function useCreationOptions(draft: CreationDraft): CreationOptions {
    const {
        raceId,
        classId,
        backgroundId,
        backgroundAbilityChoices,
        originAbilityFocus,
        speciesChoices,
    } = draft

    const raceOptions = computed<CreationSpeciesOption[]>(() =>
        RULES_2024_SPECIES.map(species => speciesAsCreation(species.id)),
    )

    const classOptions = computed(() => RULES_2024_CLASSES)

    const backgroundOptions = computed<CreationBackgroundOption[]>(() =>
        RULES_2024_BACKGROUNDS.map(item => backgroundAsCreation(item.id)),
    )

    const selectedRace = computed(() => speciesAsCreation(raceId.value))

    const selected2024Species = computed(() => findSpecies2024(raceId.value))

    const selectedSpeciesIcon = computed(() => speciesIconFor(raceId.value))

    const selectedClass = computed(() => findRules2024Class(classId.value))

    const selectedBackground = computed(
        () =>
            backgroundOptions.value.find(item => item.id === backgroundId.value) ??
            backgroundOptions.value[0]!,
    )

    const selectedModernBackground = computed(() => findRules2024Background(backgroundId.value))

    const selectedBackgroundIcon = computed(
        () => selectedBackground.value.icon ?? backgroundIconFor(backgroundId.value),
    )

    const classEquipmentOptions = computed(() => selectedClass.value.equipmentOptions ?? [])

    const backgroundEquipmentOptions = computed(
        () => selectedBackground.value?.equipmentOptions ?? [],
    )

    const backgroundChoiceIssue = computed(() => {
        if (!backgroundId.value) return 'Выберите предысторию, чтобы продолжить.'
        const background = selectedModernBackground.value

        const allowed = background?.abilityOptions ?? []

        const validChoices =
            backgroundAbilityChoices.value.length === Math.min(3, allowed.length) &&
            backgroundAbilityChoices.value.every(key => allowed.includes(key))
        if (!validChoices) return 'Выберите три характеристики для бонусов предыстории.'
        if (
            !originAbilityFocus.value ||
            !backgroundAbilityChoices.value.includes(originAbilityFocus.value)
        )
            return 'Выберите характеристику, которая получит бонус +2.'
        return ''
    })

    const speciesChoiceIssue = computed(() => {
        const missing = selected2024Species.value.choices.find(
            choice => (speciesChoices.value[choice.id]?.length ?? 0) < choice.minSelections,
        )
        return missing ? `Выберите вариант: ${missing.label}.` : ''
    })
    return {
        raceOptions,
        classOptions,
        backgroundOptions,
        selectedRace,
        selected2024Species,
        selectedSpeciesIcon,
        selectedClass,
        selectedBackground,
        selectedModernBackground,
        selectedBackgroundIcon,
        classEquipmentOptions,
        backgroundEquipmentOptions,
        backgroundChoiceIssue,
        speciesChoiceIssue,
    }
}
