import type { UnwrapRef } from 'vue'

import type { CharacterGender } from '@/types/character'
import type { CharacterCreationPayload } from '@/domain/characterCreation'

import type {
    CreationDraft,
    CreationOptions,
    CreationAbilities,
    CreationSkills,
    CreationPreview,
    CreationChoices,
    CreationNavigation,
    CreationCharacterSource,
} from '../types/characterCreation'
import { useCreationDraft } from './useCreationDraft'
import { useCreationOptions } from './useCreationOptions'
import { useCreationChoices } from './useCreationChoices'
import { useCreationAbilities } from './useCreationAbilities'
import { useCreationSkills } from './useCreationSkills'
import { useCreationPreview } from './useCreationPreview'
import { useCreationNavigation } from './useCreationNavigation'

type CharacterCreation = CreationDraft &
    CreationOptions &
    CreationAbilities &
    CreationSkills &
    CreationPreview &
    CreationChoices &
    CreationNavigation & {
        updateName: (name: unknown) => void
        updateGender: (gender: CharacterGender) => void
        updateAlignment: (alignment: string) => void
        updateSubclass: (subclass: string) => void
        editCreation: () => void
        applyCreation: () => void
    }

export type CharacterCreationModel = UnwrapRef<CharacterCreation>

export function useCharacterCreation(
    character: CreationCharacterSource,
    onCreate: (payload: CharacterCreationPayload) => void,
): CharacterCreation {
    const draft = useCreationDraft()

    const options = useCreationOptions(draft)

    const abilities = useCreationAbilities(draft, options)

    const skills = useCreationSkills(draft, options, abilities, character)

    const preview = useCreationPreview(draft, options, character)

    const choices = useCreationChoices(draft, options)

    const navigation = useCreationNavigation(draft, options, skills, abilities, preview)

    const {
        ruleset,
        isCompleted,
        raceId,
        subraceId,
        classId,
        backgroundId,
        backgroundEquipmentId,
        backgroundAbilityChoices,
        originAbilityFocus,
        speciesChoices,
        name,
        gender,
        subclass,
        alignment,
        selectedSkillIds,
        raceSkillChoices,
        raceAbilityChoices,
        baseAbilities,
        classEquipmentId,
    } = draft

    const { selectedModernBackground } = options

    const { stepIssue } = navigation

    function updateName(value: unknown) {
        name.value = String(value ?? '')
        isCompleted.value = false
    }

    function updateGender(value: CharacterGender) {
        gender.value = value
        isCompleted.value = false
    }

    function applyCreation() {
        if (stepIssue.value || !name.value.trim()) return
        const payload: CharacterCreationPayload = {
            ruleset: ruleset.value,
            gender: gender.value,
            speciesId: ruleset.value === '2024' ? raceId.value : undefined,
            speciesChoices:
                ruleset.value === '2024'
                    ? Object.fromEntries(
                          Object.entries(speciesChoices.value).map(([choiceId, selections]) => [
                              choiceId,
                              [...selections],
                          ]),
                      )
                    : undefined,
            name: name.value,
            raceId: raceId.value,
            subraceId: subraceId.value || undefined,
            classId: classId.value,
            backgroundId: backgroundId.value,
            subclass: subclass.value,
            alignment: alignment.value,
            baseAbilities: { ...baseAbilities },
            classSkillIds: [...selectedSkillIds.value],
            raceSkillChoices: [...raceSkillChoices.value],
            raceAbilityChoices: [...raceAbilityChoices.value],
            originFeatId:
                ruleset.value === '2024' ? selectedModernBackground.value?.originFeatId : undefined,
            originAbilityChoices:
                ruleset.value === '2024' ? [...backgroundAbilityChoices.value] : undefined,
            originAbilityFocus: ruleset.value === '2024' ? originAbilityFocus.value : undefined,
            classEquipmentId: classEquipmentId.value || undefined,
            backgroundEquipmentId: backgroundEquipmentId.value || undefined,
        }
        onCreate(payload)
        isCompleted.value = true
    }

    function updateAlignment(nextAlignment: string) {
        alignment.value = nextAlignment
    }

    function updateSubclass(nextSubclass: string) {
        subclass.value = nextSubclass
    }

    function editCreation() {
        isCompleted.value = false
    }
    return {
        ...draft,
        ...options,
        ...abilities,
        ...skills,
        ...preview,
        ...choices,
        ...navigation,
        updateName,
        updateGender,
        updateAlignment,
        updateSubclass,
        editCreation,
        applyCreation,
    }
}
