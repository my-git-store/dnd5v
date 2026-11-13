import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { isRules2024SpellId } from '@/data/rules2024'
import type { CharacterSpellcasting, CharacterSpellRecord } from '@/types/character'

export function useCharacterMagic() {
    const { character } = useCharacterSheet()

    function updateSpells(spells: CharacterSpellRecord[]) {
        if (!character.value) return
        const spellcasting = character.value.spellcasting
        spellcasting.knownSpells = spells
        spellcasting.spellIds = [
            ...new Set(spells.map(spell => spell.id).filter(isRules2024SpellId)),
        ]
        const knownIds = new Set(spells.map(spell => spell.id))
        spellcasting.preparedSpellIds = spellcasting.preparedSpellIds.filter(id => knownIds.has(id))
    }

    function updateCantrips(cantrips: CharacterSpellRecord[]) {
        if (!character.value) return
        character.value.spellcasting.cantrips = cantrips
        character.value.spellcasting.cantripIds = [
            ...new Set(cantrips.map(spell => spell.id).filter(isRules2024SpellId)),
        ]
    }

    function updateSpellcasting(spellcasting: CharacterSpellcasting) {
        if (character.value) character.value.spellcasting = spellcasting
    }

    return {
        updateSpells,
        updateCantrips,
        updateSpellcasting,
    }
}
