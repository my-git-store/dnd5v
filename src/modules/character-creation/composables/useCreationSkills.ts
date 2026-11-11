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
    const { ruleset, selectedSkillIds, raceSkillChoices, baseAbilities, isCompleted } = draft

    const { selectedRace, selectedClass, selectedBackground, selectedSubrace } = options

    const { finalAbility } = abilities

    const derivedRaceSkills = computed(() =>
        ruleset.value === '2024'
            ? []
            : [
                  ...new Set([
                      ...(selectedRace.value.skillProficiencies ?? []),
                      ...raceSkillChoices.value,
                      ...(selectedSubrace.value?.skillProficiencies ?? []),
                  ]),
              ],
    )

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

    const raceSelectedCount = computed(
        () =>
            raceSkillChoices.value.filter(id =>
                selectedRace.value.skillChoices?.options.includes(id),
            ).length,
    )

    const classSkillsRemaining = computed(() =>
        Math.max(0, selectedClass.value.skillChoiceCount - selectedCount.value),
    )

    const raceSkillsRemaining = computed(() =>
        Math.max(0, (selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value),
    )

    const selectableSkills = computed(() =>
        character().skills.filter(
            skill =>
                selectedClass.value.skillOptions.includes(skill.id) ||
                selectedRace.value.skillChoices?.options.includes(skill.id),
        ),
    )

    const currentOwnedSkills = computed(() =>
        character()
            .skills.map(skill => {
                const sources = new Set<string>()
                if (derivedRaceSkills.value.includes(skill.id)) sources.add('race')
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
        return selectedSkillIds.value.includes(id) || raceSkillChoices.value.includes(id)
    }

    function canSelectSkill(id: string) {
        const classAvailable =
            selectedClass.value.skillOptions.includes(id) &&
            selectedCount.value < selectedClass.value.skillChoiceCount

        const raceAvailable =
            selectedRace.value.skillChoices?.options.includes(id) &&
            raceSelectedCount.value < (selectedRace.value.skillChoices?.count ?? 0)
        return Boolean(classAvailable || raceAvailable)
    }

    function toggleSelectableSkill(id: string) {
        const classOption = selectedClass.value.skillOptions.includes(id)

        const raceOption = selectedRace.value.skillChoices?.options.includes(id) ?? false
        if (
            classOption &&
            (selectedSkillIds.value.includes(id) ||
                !raceOption ||
                selectedCount.value < selectedClass.value.skillChoiceCount)
        ) {
            toggleClassSkill(id)
            return
        }
        if (raceOption) toggleRaceSkill(id)
    }

    function selectableSkillSource(id: string) {
        const sources: string[] = []
        if (selectedClass.value.skillOptions.includes(id)) sources.push('Класс')
        if (selectedRace.value.skillChoices?.options.includes(id)) sources.push('Вид')
        return sources.join(' · ')
    }

    function toggleClassSkill(id: string) {
        if (!selectedClass.value.skillOptions.includes(id)) return
        if (selectedSkillIds.value.includes(id))
            selectedSkillIds.value = selectedSkillIds.value.filter(item => item !== id)
        else if (selectedCount.value < selectedClass.value.skillChoiceCount)
            selectedSkillIds.value = [...new Set([...selectedSkillIds.value, id])]
        isCompleted.value = false
    }

    function toggleRaceSkill(id: string) {
        const options = selectedRace.value.skillChoices?.options ?? []

        const limit = selectedRace.value.skillChoices?.count ?? 0
        if (!options.includes(id)) return
        if (raceSkillChoices.value.includes(id))
            raceSkillChoices.value = raceSkillChoices.value.filter(item => item !== id)
        else if (raceSelectedCount.value < limit)
            raceSkillChoices.value = [...new Set([...raceSkillChoices.value, id])]
        isCompleted.value = false
    }
    return {
        skillLabels,
        selectedCount,
        raceSelectedCount,
        classSkillsRemaining,
        raceSkillsRemaining,
        selectableSkills,
        currentOwnedSkills,
        isSkillChoiceSelected,
        canSelectSkill,
        toggleSelectableSkill,
        selectableSkillSource,
    }
}
