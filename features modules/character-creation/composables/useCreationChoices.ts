import { findRules2024Class } from '../data/rules2024'
import type { AbilityKey } from '@/types/character'
import { backgroundAsCreation } from '../utils/creationOptions'
import type { CreationDraft, CreationOptions, CreationChoices } from '../types/characterCreation'

export function useCreationChoices(
    draft: CreationDraft,
    options: CreationOptions,
): CreationChoices {
    const {
        raceId,
        classId,
        backgroundId,
        backgroundEquipmentId,
        backgroundAbilityChoices,
        originAbilityFocus,
        speciesChoices,
        selectedSkillIds,
        classEquipmentId,
        highestUnlockedStep,
        isCompleted,
    } = draft

    const { selectedBackground, backgroundChoiceIssue, speciesChoiceIssue } = options

    function updateRace(id: string) {
        raceId.value = id
        speciesChoices.value = {}
        highestUnlockedStep.value = Math.min(
            highestUnlockedStep.value,
            speciesChoiceIssue.value ? 2 : 3,
        )
        isCompleted.value = false
    }

    function updateBackground(id: string) {
        backgroundId.value = id
        const background = backgroundAsCreation(id)
        backgroundEquipmentId.value = background.equipmentOptions[0]?.id ?? ''
        backgroundAbilityChoices.value = [...background.abilityOptions.slice(0, 3)]
        originAbilityFocus.value = background.abilityOptions[0]
        highestUnlockedStep.value = Math.min(
            highestUnlockedStep.value,
            backgroundChoiceIssue.value ? 3 : 4,
        )
        isCompleted.value = false
    }

    function updateClass(id: string) {
        classId.value = id
        const nextClass = findRules2024Class(id)
        selectedSkillIds.value = [
            ...new Set(
                selectedSkillIds.value.filter(skillId => nextClass.skillOptions.includes(skillId)),
            ),
        ].slice(0, nextClass.skillChoiceCount)
        classEquipmentId.value = nextClass.equipmentOptions?.[0]?.id ?? ''
        isCompleted.value = false
    }

    function selectSpeciesChoice(choiceId: string, value: string | null) {
        if (!value) return
        speciesChoices.value = { ...speciesChoices.value, [choiceId]: [value] }
        if (!speciesChoiceIssue.value)
            highestUnlockedStep.value = Math.max(highestUnlockedStep.value, 3)
        isCompleted.value = false
    }

    function toggleBackgroundAbility(key: AbilityKey) {
        const options = selectedBackground.value?.abilityOptions ?? []
        if (!options.includes(key)) return
        if (backgroundAbilityChoices.value.includes(key)) {
            backgroundAbilityChoices.value = backgroundAbilityChoices.value.filter(
                item => item !== key,
            )
            if (originAbilityFocus.value === key)
                originAbilityFocus.value = backgroundAbilityChoices.value[0]
        } else if (backgroundAbilityChoices.value.length < 3) {
            backgroundAbilityChoices.value = [...backgroundAbilityChoices.value, key]
        }
        highestUnlockedStep.value = Math.min(
            highestUnlockedStep.value,
            backgroundChoiceIssue.value ? 3 : 4,
        )
        isCompleted.value = false
    }

    function selectOriginAbilityFocus(key: AbilityKey) {
        if (backgroundAbilityChoices.value.includes(key)) originAbilityFocus.value = key
        highestUnlockedStep.value = Math.min(
            highestUnlockedStep.value,
            backgroundChoiceIssue.value ? 3 : 4,
        )
        isCompleted.value = false
    }

    function selectClassKit(id: string) {
        classEquipmentId.value = id
        isCompleted.value = false
    }

    function selectBackgroundKit(id: string) {
        backgroundEquipmentId.value = id
        isCompleted.value = false
    }

    return {
        updateRace,
        updateBackground,
        updateClass,
        selectSpeciesChoice,
        toggleBackgroundAbility,
        selectOriginAbilityFocus,
        selectClassKit,
        selectBackgroundKit,
    }
}
