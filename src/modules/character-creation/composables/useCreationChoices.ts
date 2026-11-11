import {
    DND5E_RACES,
    DND5E_CLASSES,
    DND5E_BACKGROUNDS,
    findClass,
    subracesForRace,
} from '@/data/dnd5eOptions'
import { RULES_2024_SPECIES, RULES_2024_CLASSES, RULES_2024_BACKGROUNDS } from '@/data/rules2024'
import type { AbilityKey, CharacterRuleset } from '@/types/character'

import { classAsLegacy, backgroundAsCreation } from '../utils/creationOptions'
import type { CreationDraft, CreationOptions, CreationChoices } from '../types/characterCreation'

export function useCreationChoices(
    draft: CreationDraft,
    options: CreationOptions,
): CreationChoices {
    const {
        ruleset,
        raceId,
        subraceId,
        classId,
        backgroundId,
        backgroundEquipmentId,
        backgroundAbilityChoices,
        originAbilityFocus,
        speciesChoices,
        selectedSkillIds,
        raceSkillChoices,
        raceAbilityChoices,
        classEquipmentId,
        highestUnlockedStep,
        isCompleted,
    } = draft

    const {
        selectedRace,
        selectedClass,
        selectedBackground,
        backgroundChoiceIssue,
        speciesChoiceIssue,
    } = options

    function updateRace(id: string) {
        raceId.value = id
        subraceId.value = ruleset.value === '2024' ? '' : (subracesForRace(id)[0]?.id ?? '')
        raceAbilityChoices.value =
            selectedRace.value.abilityChoices?.options.slice(
                0,
                selectedRace.value.abilityChoices.count,
            ) ?? []
        raceSkillChoices.value = []
        speciesChoices.value = {}
        highestUnlockedStep.value = Math.min(
            highestUnlockedStep.value,
            ruleset.value === '2024' && speciesChoiceIssue.value ? 2 : 3,
        )
        isCompleted.value = false
    }

    function updateBackground(id: string) {
        backgroundId.value = id
        const background = backgroundAsCreation(id, ruleset.value)
        backgroundEquipmentId.value = background.equipmentOptions[0]?.id ?? ''
        backgroundAbilityChoices.value =
            ruleset.value === '2024' ? [...(background.abilityOptions ?? []).slice(0, 3)] : []
        originAbilityFocus.value =
            ruleset.value === '2024' ? background.abilityOptions?.[0] : undefined
        highestUnlockedStep.value = Math.min(
            highestUnlockedStep.value,
            backgroundChoiceIssue.value ? 3 : 4,
        )
        isCompleted.value = false
    }

    function updateClass(id: string) {
        classId.value = id
        const nextClass = ruleset.value === '2024' ? classAsLegacy(id) : findClass(id)
        selectedSkillIds.value = [
            ...new Set(
                selectedSkillIds.value.filter(skillId => nextClass.skillOptions.includes(skillId)),
            ),
        ].slice(0, nextClass.skillChoiceCount)
        classEquipmentId.value = nextClass.equipmentOptions?.[0]?.id ?? ''
        isCompleted.value = false
    }

    function updateRulesetValue(value: string | null) {
        updateRuleset(value === '2014' ? '2014' : '2024')
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

    function selectSubrace(id: string) {
        subraceId.value = id
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

    function updateRuleset(value: CharacterRuleset) {
        ruleset.value = value
        if (value === '2024') {
            raceId.value = RULES_2024_SPECIES[0]!.id
            classId.value = RULES_2024_CLASSES[0]!.id
            backgroundId.value = RULES_2024_BACKGROUNDS[0]?.id ?? ''
        } else {
            raceId.value = DND5E_RACES[0]!.id
            classId.value = DND5E_CLASSES[DND5E_CLASSES.length - 1]!.id
            backgroundId.value = DND5E_BACKGROUNDS[0]?.id ?? ''
        }
        const background = backgroundAsCreation(backgroundId.value, ruleset.value)
        backgroundEquipmentId.value = background.equipmentOptions[0]?.id ?? ''
        backgroundAbilityChoices.value =
            value === '2024' ? [...(background.abilityOptions ?? []).slice(0, 3)] : []
        originAbilityFocus.value = value === '2024' ? background.abilityOptions?.[0] : undefined
        subraceId.value = ''
        classEquipmentId.value = selectedClass.value.equipmentOptions?.[0]?.id ?? ''
        selectedSkillIds.value = []
        raceSkillChoices.value = []
        speciesChoices.value = {}
        highestUnlockedStep.value = 1
        isCompleted.value = false
    }
    return {
        updateRace,
        updateBackground,
        updateClass,
        updateRulesetValue,
        selectSpeciesChoice,
        toggleBackgroundAbility,
        selectOriginAbilityFocus,
        selectSubrace,
        selectClassKit,
        selectBackgroundKit,
    }
}
