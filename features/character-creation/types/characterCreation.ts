import type { ComputedRef, Ref } from 'vue'

import type { AbilityKey, CharacterAbilities, CharacterGender } from '@/types/character'
import type { CharacterSheetView, CharacterSkillView } from '@/types/characterView'
import type { RuleEquipmentOption } from '@/types/rules'
import type { RaceProfile } from '@/types/character'
import type { Rules2024Background, Rules2024Class } from '../data/rules2024'
import type { findSpecies2024, findRules2024Background } from '../data/rules2024'

export type CreationComputed<T> = { [Key in keyof T]: ComputedRef<T[Key]> }
export type CreationCharacterSource = () => CharacterSheetView

export type CreationDraftValues = {
    currentStep: number
    highestUnlockedStep: number
    isCompleted: boolean
    raceId: string
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
    classEquipmentId: string
}

export type CreationDraft = {
    [Key in keyof CreationDraftValues]: Ref<CreationDraftValues[Key]>
} & { baseAbilities: CharacterAbilities }

export type CreationSpeciesOption = { id: string; label: string; profile: RaceProfile }

export type CreationBackgroundOption = Rules2024Background & {
    originFeatLabel?: string
    originFeatDescription?: string
}

export type CreationOptions = CreationComputed<{
    raceOptions: CreationSpeciesOption[]
    classOptions: Rules2024Class[]
    backgroundOptions: CreationBackgroundOption[]
    selectedRace: CreationSpeciesOption
    selected2024Species: ReturnType<typeof findSpecies2024>
    selectedSpeciesIcon: string | undefined
    selectedClass: Rules2024Class
    selectedBackground: CreationBackgroundOption
    selectedModernBackground: ReturnType<typeof findRules2024Background> | undefined
    selectedBackgroundIcon: string | undefined
    classEquipmentOptions: RuleEquipmentOption[]
    backgroundEquipmentOptions: RuleEquipmentOption[]
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
    classSkillsRemaining: number
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

export type CreationEquipmentItem = RuleEquipmentOption['items'][number] & { source: string }

export type CreationPreview = CreationComputed<{
    initials: string
    selectedClassKit: RuleEquipmentOption | undefined
    selectedBackgroundKit: RuleEquipmentOption | undefined
    previewEquipment: CreationEquipmentItem[]
    previewFeatures: string[]
}>

export type CreationChoices = {
    updateRace: (id: string) => void
    updateBackground: (id: string) => void
    updateClass: (id: string) => void
    selectSpeciesChoice: (choiceId: string, choice: string | null) => void
    toggleBackgroundAbility: (key: AbilityKey) => void
    selectOriginAbilityFocus: (key: AbilityKey) => void
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
