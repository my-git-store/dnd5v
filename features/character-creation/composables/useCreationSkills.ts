import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSkillBonus } from '@/domain/skillBonus'

import type {
    CreationDraft,
    CreationOptions,
    CreationAbilities,
    CreationSkills,
    CreationOwnedSkill,
    CreationCharacterSource,
} from '../types/characterCreation'

export function useCreationSkills(
    draft: CreationDraft,
    options: CreationOptions,
    abilities: CreationAbilities,
    character: CreationCharacterSource,
): CreationSkills {
    const { selectedSkillIds, baseAbilities, isCompleted } = draft

    const { selectedClass, selectedBackground } = options

    const { finalAbility } = abilities

    const skillLabels = computed(
        () =>
            Object.fromEntries(character().skills.map(skill => [skill.id, skill.name])) as Record<
                string,
                string
            >,
    )

    const selectedCount = computed(
        () =>
            selectedSkillIds.value.filter(id => selectedClass.value.skillOptions.includes(id))
                .length,
    )

    const classSkillsRemaining = computed(() =>
        Math.max(0, selectedClass.value.skillChoiceCount - selectedCount.value),
    )

    const selectableSkills = computed(() =>
        character().skills.filter(skill => selectedClass.value.skillOptions.includes(skill.id)),
    )

    const currentOwnedSkills = computed(() =>
        character()
            .skills.map(skill => {
                const sources = new Set<string>()
                if (selectedBackground.value.skillProficiencies.includes(skill.id))
                    sources.add('background')
                if (selectedSkillIds.value.includes(skill.id)) sources.add('class')
                for (const source of skill.proficiencySources ?? [])
                    if (source === 'manual' || source === 'feat') sources.add(source)
                const proficiency: CreationOwnedSkill['proficiency'] =
                    sources.size > 0 ? 'proficient' : 'none'

                const bonus = calculateSkillBonus(
                    {
                        ...skill,
                        proficiency,
                        calculationMode: 'computed',
                        additionalBonus: skill.additionalBonus,
                    },
                    {
                        ...baseAbilities,
                        ...Object.fromEntries(
                            ABILITY_FIELDS.map(field => [field.key, finalAbility(field.key)]),
                        ),
                    },
                    character().level,
                )
                return { ...skill, sources: [...sources], proficiency, bonus }
            })
            .filter(skill => skill.sources.length > 0),
    )

    function isSkillChoiceSelected(id: string) {
        return selectedSkillIds.value.includes(id)
    }

    function canSelectSkill(id: string) {
        return (
            selectedClass.value.skillOptions.includes(id) &&
            selectedCount.value < selectedClass.value.skillChoiceCount
        )
    }

    function selectableSkillSource(id: string) {
        return selectedClass.value.skillOptions.includes(id) ? 'Класс' : ''
    }

    function toggleSelectableSkill(id: string) {
        if (!selectedClass.value.skillOptions.includes(id)) return
        if (selectedSkillIds.value.includes(id))
            selectedSkillIds.value = selectedSkillIds.value.filter(item => item !== id)
        else if (selectedCount.value < selectedClass.value.skillChoiceCount)
            selectedSkillIds.value = [...new Set([...selectedSkillIds.value, id])]
        isCompleted.value = false
    }

    return {
        skillLabels,
        selectedCount,
        classSkillsRemaining,
        selectableSkills,
        currentOwnedSkills,
        isSkillChoiceSelected,
        canSelectSkill,
        toggleSelectableSkill,
        selectableSkillSource,
    }
}
