import type { CharacterSheetView } from '../types/characterView.ts'
import type {
    AbilityKey,
    CharacterAbilities,
    CharacterGender,
    CharacterRuleset,
} from '../types/character.ts'
import { applyCharacterCreation2024 } from './characterCreation2024.ts'
import { isCharacterRuleset } from './ruleset.ts'

export interface CharacterCreationPayload {
    ruleset?: CharacterRuleset
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
    if (
        !isCharacterRuleset(character.ruleset) ||
        (payload.ruleset !== undefined && !isCharacterRuleset(payload.ruleset))
    ) {
        throw new Error('Поддерживается только редакция D&D 2024.')
    }
    return applyCharacterCreation2024(character, payload)
}
