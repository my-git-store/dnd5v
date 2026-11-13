import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { Character, CharacterCombat } from '@/types/character'

export function useCharacterCombat() {
    const { character } = useCharacterSheet()

    function updateCombat(combat: CharacterCombat) {
        if (character.value) character.value.combat = combat
    }

    function updateAttacks(attacks: Character['attacks']) {
        if (character.value) character.value.attacks = attacks
    }

    return {
        updateCombat,
        updateAttacks,
    }
}
