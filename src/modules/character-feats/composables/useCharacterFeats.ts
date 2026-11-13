import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterFeat } from '@/types/character'

export function useCharacterFeats() {
    const { character } = useCharacterSheet()

    function updateFeats(feats: CharacterFeat[]) {
        if (character.value) character.value.feats = feats
    }

    return {
        updateFeats,
    }
}
