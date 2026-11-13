import { useCharacterSheet } from '@/composables/useCharacterSheet'
import {
    defaultProgressionForCharacter,
    progressionAtLevel,
} from '@/domain/characterProgressionData'
import type { CharacterIdentityPatch, CharacterPersonality } from '@/types/character'

export function useCharacterIdentity() {
    const { character } = useCharacterSheet()

    function updateIdentity(patch: CharacterIdentityPatch) {
        if (!character.value) return
        Object.assign(character.value.identity, patch)
        if (patch.level !== undefined) {
            character.value.progression = progressionAtLevel(
                character.value.progression ?? defaultProgressionForCharacter(character.value),
                patch.level,
            )
        }
    }

    function updatePersonality(personality: CharacterPersonality) {
        if (character.value) character.value.personality = personality
    }

    return {
        updateIdentity,
        updatePersonality,
    }
}
