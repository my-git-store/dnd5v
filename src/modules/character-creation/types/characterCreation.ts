import type { ComputedRef, Ref } from 'vue'

import type {
    AbilityKey,
    CharacterAbilities,
    CharacterGender,
    CharacterRuleset,
} from '@/types/character'
import type { CharacterSheetView, CharacterSkillView } from '@/types/characterView'
import type {
    Dnd5eBackgroundOption,
    Dnd5eClassOption,
    Dnd5eEquipmentOption,
    Dnd5eRaceOption,
    Dnd5eSubraceOption,
} from '@/data/dnd5eOptions'
import type { findSpecies2024, findRules2024Background } from '@/data/rules2024'

export type CreationComputed<T> = { [Key in keyof T]: ComputedRef<T[Key]> }
export type CreationCharacterSource = () => CharacterSheetView

export type CreationDraftValues = {
    currentStep: number
    highestUnlockedStep: number
    isCompleted: boolean
    ruleset: CharacterRuleset
    raceId: string
    subraceId: string
    classId: string
    backgroundId: string
    backgroundEquipmentId: string
    backgroundAbilityChoices: AbilityKey[]
    originAbilityFocus: AbilityKey | undefined
    speciesChoices: Record<string, string[]>
    name: string
    gender: CharacterGender
    subclass: string
    alignment: string
    selectedSkillIds: string[]
    raceSkillChoices: string[]
    raceAbilityChoices: AbilityKey[]
    classEquipmentId: string
}

export type CreationDraft = {
    [Key in keyof CreationDraftValues]: Ref<CreationDraftValues[Key]>
} & { baseAbilities: CharacterAbilities }

export type CreationBackgroundOption = Dnd5eBackgroundOption & {
    icon?: string
    abilityOptions?: AbilityKey[]
    originFeatId?: string
    originFeatLabel?: string
    originFeatDescription?: string
}

export type CreationOptions = CreationComputed<{
    raceOptions: Dnd5eRaceOption[]
    classOptions: Dnd5eClassOption[]
    backgroundOptions: CreationBackgroundOption[]
    selectedRace: Dnd5eRaceOption
    selected2024Species: ReturnType<typeof findSpecies2024>
    selectedSpeciesIcon: string | undefined
    selectedSubrace: Dnd5eSubraceOption | undefined
    selectedClass: Dnd5eClassOption
    selectedBackground: CreationBackgroundOption
    selectedModernBackground: ReturnType<typeof findRules2024Background> | undefined
    selectedBackgroundIcon: string | undefined
    availableSubraces: Dnd5eSubraceOption[]
    classEquipmentOptions: Dnd5eEquipmentOption[]
    backgroundEquipmentOptions: Dnd5eEquipmentOption[]
    backgroundChoiceIssue: string
    speciesChoiceIssue: string
}>

export type CreationOwnedSkill = CharacterSkillView & {
    sources: string[]
    bonus: number | null
}

export type CreationSkills = CreationComputed<{
    skillLabels: Record<string, string>
    selectedCount: number
    raceSelectedCount: number
    classSkillsRemaining: number
    raceSkillsRemaining: number
    selectableSkills: CharacterSkillView[]
    currentOwnedSkills: CreationOwnedSkill[]
}> & {
    isSkillChoiceSelected: (id: string) => boolean
    canSelectSkill: (id: string) => boolean
    toggleSelectableSkill: (id: string) => void
    selectableSkillSource: (id: string) => string
}

export type CreationAbilities = {
    finalAbility: (key: AbilityKey) => number
    hasAbilityError: ComputedRef<boolean>
    updateAbility: (key: AbilityKey, input: unknown) => void
}

export type CreationEquipmentItem = Dnd5eEquipmentOption['items'][number] & { source: string }

export type CreationPreview = CreationComputed<{
    initials: string
    selectedClassKit: Dnd5eEquipmentOption | undefined
    selectedBackgroundKit: Dnd5eEquipmentOption | undefined
    previewEquipment: CreationEquipmentItem[]
    previewFeatures: string[]
}>

export type CreationChoices = {
    updateRace: (id: string) => void
    updateBackground: (id: string) => void
    updateClass: (id: string) => void
    updateRulesetValue: (ruleset: string | null) => void
    selectSpeciesChoice: (choiceId: string, choice: string | null) => void
    toggleBackgroundAbility: (key: AbilityKey) => void
    selectOriginAbilityFocus: (key: AbilityKey) => void
    selectSubrace: (id: string) => void
    selectClassKit: (id: string) => void
    selectBackgroundKit: (id: string) => void
}

export type CreationStep = { id: string; number: number; label: string }

export type CreationNavigation = CreationComputed<{
    steps: CreationStep[]
    stepProgress: number
    stepIssue: string
    canContinue: boolean
}> & {
    stepLabel: (index: number) => string
    stepDescription: (index: number) => string
    goToStep: (step: number) => void
    nextStep: () => void
    previousStep: () => void
}
