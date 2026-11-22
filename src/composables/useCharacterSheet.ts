import { computed, ref } from 'vue'

import {
    hasIncompatibleStoredCharacter,
    readStoredCharacter,
    writeStoredCharacter,
} from '@/api/characterStorage'
import { createEmptyCharacter } from '@/data/character.mock'
import type { Character } from '@/types/character'

const character = ref<Character | null>(null)

const savedSnapshot = ref<string | null>(null)

const isLoading = ref(true)

const loadError = ref<string | null>(null)

const saveError = ref<string | null>(null)

const storageWarning = ref<string | null>(null)

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
            character.value = stored
            savedSnapshot.value = stored ? JSON.stringify(stored) : null
            storageWarning.value = hasIncompatibleStoredCharacter()
                ? 'В браузере найдены прежние сохранения персонажей или НПС. Они не удаляются и не изменяются этим листом.'
                : null
        } catch (error) {
            loadError.value =
                error instanceof Error ? error.message : 'Не удалось загрузить персонажа.'
        } finally {
            isLoading.value = false
        }
    }

    function save(preservePrevious = false) {
        if (!character.value) return
        try {
            writeStoredCharacter(character.value, undefined, preservePrevious)
            savedSnapshot.value = JSON.stringify(character.value)
            saveError.value = null
            storageWarning.value = null
            return true
        } catch {
            saveError.value =
                'Не удалось сохранить изменения. Они остались на странице; попробуйте ещё раз.'
            return false
        }
    }

    function createCharacter() {
        character.value = createEmptyCharacter()
        savedSnapshot.value = null
        loadError.value = null
        saveError.value = null
        save(true)
    }

    return {
        character,
        isLoading,
        loadError,
        saveError,
        storageWarning,
        isDirty,
        load,
        save,
        createCharacter,
    }
}
