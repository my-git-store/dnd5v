import { computed, ref } from 'vue'

import { readStoredCharacter, writeStoredCharacter } from '@/api/characterStorage'
import { createEmptyCharacter } from '@/data/character.mock'
import type { Character } from '@/types/character'

const character = ref<Character | null>(null)

const savedSnapshot = ref<string | null>(null)

const isLoading = ref(true)

const loadError = ref<string | null>(null)

const saveError = ref<string | null>(null)

const isDirty = computed(
    () => character.value !== null && JSON.stringify(character.value) !== savedSnapshot.value,
)

export function useCharacterSheet() {
    function load() {
        isLoading.value = true
        loadError.value = null
        saveError.value = null
        try {
            const stored = readStoredCharacter()
            character.value = stored ?? createEmptyCharacter()
            savedSnapshot.value = stored ? JSON.stringify(stored) : null
        } catch (error) {
            loadError.value =
                error instanceof Error ? error.message : 'Не удалось загрузить персонажа.'
        } finally {
            isLoading.value = false
        }
    }

    function save() {
        if (!character.value) return
        saveError.value = null
        try {
            writeStoredCharacter(character.value)
            savedSnapshot.value = JSON.stringify(character.value)
        } catch (error) {
            saveError.value =
                error instanceof Error ? error.message : 'Не удалось сохранить персонажа.'
        }
    }

    function createCharacter() {
        character.value = createEmptyCharacter()
        savedSnapshot.value = null
        loadError.value = null
        save()
    }

    return {
        character,
        isLoading,
        loadError,
        saveError,
        isDirty,
        load,
        save,
        createCharacter,
    }
}
