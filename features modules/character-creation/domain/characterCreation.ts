import type { CharacterSheetView } from '@/types/characterView'
import type {
    AbilityKey,
    CharacterAbilities,
    CharacterGender,
} from '@/types/character'
import { applyCharacterCreation2024 } from './characterCreation2024'

export interface CharacterCreationPayload {
    gender?: CharacterGender
    speciesId?: string
    originFeatId?: string
    originAbilityChoices?: AbilityKey[]
    originAbilityFocus?: AbilityKey
    speciesChoices?: Record<string, string[]>
    name: string
    raceId: string
    classId: string
    backgroundId?: string
    subclass: string
    alignment: string
    baseAbilities: CharacterAbilities
    classSkillIds: string[]
    classEquipmentId?: string
    backgroundEquipmentId?: string
}

export function applyCharacterCreation(
    character: CharacterSheetView,
    payload: CharacterCreationPayload,
): CharacterSheetView {
    return applyCharacterCreation2024(character, payload)
}
