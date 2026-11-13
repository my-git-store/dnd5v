import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { AbilityKey, CharacterSavingThrowPatch, CharacterSkillPatch } from '@/types/character'

export function useCharacterMain() {
    const { character } = useCharacterSheet()

    function updateAbility(key: AbilityKey, value: number) {
        if (character.value) character.value.abilities[key] = value
    }

    function updateSkill(id: string, patch: CharacterSkillPatch) {
        const item = character.value?.skills.find(skill => skill.id === id)
        if (item) Object.assign(item, patch)
    }

    function updateSavingThrow(key: AbilityKey, patch: CharacterSavingThrowPatch) {
        if (!character.value) return
        Object.assign(character.value.savingThrows[key], patch)
        const creation = character.value.extensions.characterCreation
        if (
            patch.proficient !== undefined &&
            creation &&
            !creation.classSavingThrowKeys.includes(key)
        ) {
            const manualKeys = new Set(creation.manualSavingThrowKeys ?? [])
            if (patch.proficient) manualKeys.add(key)
            else manualKeys.delete(key)
            creation.manualSavingThrowKeys = [...manualKeys]
        }
    }

    return {
        updateAbility,
        updateSkill,
        updateSavingThrow,
    }
}
