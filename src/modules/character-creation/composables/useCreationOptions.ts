import { computed } from 'vue'

import {
    DND5E_RACES,
    DND5E_CLASSES,
    DND5E_BACKGROUNDS,
    findRace,
    findSubrace,
    findClass,
    subracesForRace,
} from '@/data/dnd5eOptions'
import type { Dnd5eRaceOption, Dnd5eClassOption } from '@/data/dnd5eOptions'
import {
    RULES_2024_SPECIES,
    RULES_2024_CLASSES,
    RULES_2024_BACKGROUNDS,
    findSpecies2024,
    findRules2024Background,
} from '@/data/rules2024'
import { speciesIconFor } from '@/data/speciesIcons'
import { backgroundIconFor } from '@/data/backgroundIcons'

import { speciesAsLegacy, classAsLegacy, backgroundAsCreation } from '../utils/creationOptions'
import type {
    CreationDraft,
    CreationOptions,
    CreationBackgroundOption,
} from '../types/characterCreation'

export function useCreationOptions(draft: CreationDraft): CreationOptions {
    const {
        ruleset,
        raceId,
        subraceId,
        classId,
        backgroundId,
        backgroundAbilityChoices,
        originAbilityFocus,
        speciesChoices,
    } = draft

    const raceOptions = computed<Dnd5eRaceOption[]>(() =>
        ruleset.value === '2024'
            ? RULES_2024_SPECIES.map(species => speciesAsLegacy(species.id))
            : DND5E_RACES,
    )

    const classOptions = computed<Dnd5eClassOption[]>(() =>
        ruleset.value === '2024'
            ? RULES_2024_CLASSES.map(item => classAsLegacy(item.id))
            : DND5E_CLASSES,
    )

    const backgroundOptions = computed<CreationBackgroundOption[]>(() =>
        ruleset.value === '2024'
            ? RULES_2024_BACKGROUNDS.map(item => backgroundAsCreation(item.id, ruleset.value))
            : DND5E_BACKGROUNDS,
    )

    const selectedRace = computed(() =>
        ruleset.value === '2024' ? speciesAsLegacy(raceId.value) : findRace(raceId.value),
    )

    const selected2024Species = computed(() => findSpecies2024(raceId.value))

    const selectedSpeciesIcon = computed(() =>
        ruleset.value === '2024' ? speciesIconFor(raceId.value) : undefined,
    )

    const selectedSubrace = computed(() =>
        ruleset.value === '2024' ? undefined : findSubrace(raceId.value, subraceId.value),
    )

    const selectedClass = computed(() =>
        ruleset.value === '2024' ? classAsLegacy(classId.value) : findClass(classId.value),
    )

    const selectedBackground = computed(
        () =>
            backgroundOptions.value.find(item => item.id === backgroundId.value) ??
            backgroundOptions.value[0]!,
    )

    const selectedModernBackground = computed(() =>
        ruleset.value === '2024' ? findRules2024Background(backgroundId.value) : undefined,
    )

    const selectedBackgroundIcon = computed(() =>
        ruleset.value === '2024'
            ? (selectedBackground.value.icon ?? backgroundIconFor(backgroundId.value))
            : undefined,
    )

    const availableSubraces = computed(() =>
        ruleset.value === '2024' ? [] : subracesForRace(raceId.value),
    )

    const classEquipmentOptions = computed(() => selectedClass.value.equipmentOptions ?? [])

    const backgroundEquipmentOptions = computed(
        () => selectedBackground.value?.equipmentOptions ?? [],
    )

    const backgroundChoiceIssue = computed(() => {
        if (!backgroundId.value) return 'Выберите предысторию, чтобы продолжить.'
        if (ruleset.value !== '2024') return ''
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
        if (ruleset.value !== '2024') return ''
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
        selectedSubrace,
        selectedClass,
        selectedBackground,
        selectedModernBackground,
        selectedBackgroundIcon,
        availableSubraces,
        classEquipmentOptions,
        backgroundEquipmentOptions,
        backgroundChoiceIssue,
        speciesChoiceIssue,
    }
}
