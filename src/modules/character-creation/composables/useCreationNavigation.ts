import { computed } from 'vue'

import {
    STEP_NAMES,
    STEP_DESCRIPTIONS,
    MODERN_STEP_NAMES,
    MODERN_STEP_DESCRIPTIONS,
} from '../data/creationSteps'
import type {
    CreationDraft,
    CreationOptions,
    CreationSkills,
    CreationAbilities,
    CreationPreview,
    CreationNavigation,
} from '../types/characterCreation'

export function useCreationNavigation(
    draft: CreationDraft,
    options: CreationOptions,
    skills: CreationSkills,
    abilities: CreationAbilities,
    preview: CreationPreview,
): CreationNavigation {
    const { name, ruleset, currentStep, highestUnlockedStep, isCompleted } = draft

    const {
        speciesChoiceIssue,
        backgroundChoiceIssue,
        availableSubraces,
        selectedSubrace,
        selectedClass,
        selectedRace,
        classEquipmentOptions,
    } = options

    const { selectedCount, raceSelectedCount } = skills

    const { hasAbilityError } = abilities

    const { selectedClassKit } = preview

    function stepLabel(index: number) {
        return ruleset.value === '2024'
            ? (MODERN_STEP_NAMES[index] ?? '')
            : (STEP_NAMES[index] ?? '')
    }

    function stepDescription(index: number) {
        return ruleset.value === '2024'
            ? (MODERN_STEP_DESCRIPTIONS[index] ?? '')
            : (STEP_DESCRIPTIONS[index] ?? '')
    }

    const stepProgress = computed(() => Math.round((currentStep.value / STEP_NAMES.length) * 100))

    const stepIssue = computed(() => {
        if (currentStep.value === 1 && !name.value.trim())
            return 'Введите имя персонажа, чтобы продолжить.'
        if (currentStep.value === 2 && speciesChoiceIssue.value) return speciesChoiceIssue.value
        if (currentStep.value === 3 && backgroundChoiceIssue.value)
            return backgroundChoiceIssue.value
        if (currentStep.value === 4 && availableSubraces.value.length > 0 && !selectedSubrace.value)
            return 'Выберите подрасу для выбранной расы.'
        if (currentStep.value === 6 && hasAbilityError.value)
            return 'Каждая характеристика должна быть целым числом от 1 до 30.'
        if (currentStep.value === 7 && selectedCount.value !== selectedClass.value.skillChoiceCount)
            return `Выберите навыки класса: ${selectedClass.value.skillChoiceCount - selectedCount.value > 0 ? `осталось ${selectedClass.value.skillChoiceCount - selectedCount.value}` : `уберите лишние ${selectedCount.value - selectedClass.value.skillChoiceCount}`}.`
        if (
            currentStep.value === 7 &&
            raceSelectedCount.value !== (selectedRace.value.skillChoices?.count ?? 0)
        )
            return `Выберите навыки вида: осталось ${(selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value}`
        if (
            currentStep.value === 8 &&
            classEquipmentOptions.value.length &&
            !selectedClassKit.value
        )
            return 'Выберите один набор снаряжения класса.'
        return ''
    })

    const canContinue = computed(() => !stepIssue.value)

    function goToStep(step: number) {
        if (step < 1 || step > highestUnlockedStep.value || step > STEP_NAMES.length) return
        currentStep.value = step
        isCompleted.value = false
    }

    function nextStep() {
        if (!canContinue.value || currentStep.value >= STEP_NAMES.length) return
        currentStep.value += 1
        highestUnlockedStep.value = Math.max(highestUnlockedStep.value, currentStep.value)
    }

    function previousStep() {
        if (currentStep.value > 1) goToStep(currentStep.value - 1)
    }

    const steps = computed(() =>
        STEP_NAMES.map((id, index) => ({ id, number: index + 1, label: stepLabel(index) })),
    )
    return {
        steps,
        stepLabel,
        stepDescription,
        stepProgress,
        stepIssue,
        canContinue,
        goToStep,
        nextStep,
        previousStep,
    }
}
