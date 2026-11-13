import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { readStoredCharacter, writeStoredCharacter } from '@/api/characterStorage'
import { createEmptyCharacter } from '@/data/character.mock'
import { isRules2024SpellId } from '@/data/rules2024'
import {
    defaultProgressionForCharacter,
    progressionAtLevel,
} from '@/domain/characterProgressionData'
import {
    changeSpellSlot,
    restoreSpellSlots,
    takeLongRest,
    takeShortRest,
    type ShortRestResult,
} from '@/domain/rest'
import type {
    AbilityKey,
    Character,
    CharacterCombat,
    CharacterFeat,
    CharacterIdentityPatch,
    CharacterInventoryItemRecord,
    CharacterMoney,
    CharacterPersonality,
    CharacterSavingThrowPatch,
    CharacterSkillPatch,
    CharacterSpellcasting,
    CharacterSpellLevel,
    CharacterSpellRecord,
} from '@/types/character'

export function useCharacterSheet() {
    const character = ref<Character | null>(null)

    const savedSnapshot = ref<string | null>(null)

    const isLoading = ref(true)

    const loadError = ref<string | null>(null)

    const isSaving = ref(false)

    const saveError = ref<string | null>(null)

    const isDirty = computed(
        () => character.value !== null && JSON.stringify(character.value) !== savedSnapshot.value,
    )

    const savedNotice = computed(() => savedSnapshot.value !== null && !isDirty.value)

    function load() {
        isLoading.value = true
        loadError.value = null
        saveError.value = null
        try {
            const stored = readStoredCharacter()
            character.value = stored ?? createEmptyCharacter('1')
            savedSnapshot.value = stored ? JSON.stringify(stored) : null
        } catch (error) {
            loadError.value =
                error instanceof Error ? error.message : 'Не удалось загрузить персонажа.'
        } finally {
            isLoading.value = false
        }
    }

    function save() {
        if (!character.value || isSaving.value) return
        isSaving.value = true
        saveError.value = null
        try {
            writeStoredCharacter(character.value)
            savedSnapshot.value = JSON.stringify(character.value)
        } catch (error) {
            saveError.value =
                error instanceof Error ? error.message : 'Не удалось сохранить персонажа.'
        } finally {
            isSaving.value = false
        }
    }

    function createCharacter() {
        character.value = createEmptyCharacter('1')
        savedSnapshot.value = null
        loadError.value = null
        save()
    }

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

    function updateCombat(combat: CharacterCombat) {
        if (character.value) character.value.combat = combat
    }

    function updateAttacks(attacks: Character['attacks']) {
        if (character.value) character.value.attacks = attacks
    }

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

    function shortRest(dice: number): ShortRestResult | null {
        if (!character.value) return null
        const result = takeShortRest(character.value.combat, character.value.abilities, dice)
        character.value.combat = result.combat
        saveError.value = null
        return result
    }

    function longRest() {
        if (!character.value) return
        character.value.combat = takeLongRest(character.value.combat)
        character.value.spellcasting.spellSlots = restoreSpellSlots(
            character.value.spellcasting.spellSlots,
        )
        saveError.value = null
    }

    function adjustSpellSlot(level: CharacterSpellLevel, delta: number) {
        if (!character.value) return
        character.value.spellcasting.spellSlots = changeSpellSlot(
            character.value.spellcasting.spellSlots,
            level,
            delta,
        )
        saveError.value = null
    }

    function useInventoryItem(id: string): boolean {
        const item = character.value?.inventory.items.find(entry => entry.id === id)
        if (!item || item.quantity <= 0) return false
        item.quantity -= 1
        saveError.value = null
        return true
    }

    function updateInventory(items: CharacterInventoryItemRecord[]) {
        if (character.value) character.value.inventory.items = items
    }

    function updateMoney(money: CharacterMoney) {
        if (character.value) character.value.inventory.money = money
    }

    function updatePersonality(personality: CharacterPersonality) {
        if (character.value) character.value.personality = personality
    }

    function updateFeats(feats: CharacterFeat[]) {
        if (character.value) character.value.feats = feats
    }

    function warnBeforeUnload(event: BeforeUnloadEvent) {
        if (!isDirty.value) return
        event.preventDefault()
        event.returnValue = ''
    }

    onMounted(() => {
        load()
        window.addEventListener('beforeunload', warnBeforeUnload)
    })
    onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

    return {
        character,
        isLoading,
        loadError,
        isSaving,
        saveError,
        savedNotice,
        isDirty,
        load,
        save,
        createCharacter,
        updateIdentity,
        updateAbility,
        updateSkill,
        updateSavingThrow,
        updateCombat,
        updateAttacks,
        updateSpells,
        updateCantrips,
        updateSpellcasting,
        shortRest,
        longRest,
        adjustSpellSlot,
        useInventoryItem,
        updateInventory,
        updateMoney,
        updatePersonality,
        updateFeats,
    }
}
