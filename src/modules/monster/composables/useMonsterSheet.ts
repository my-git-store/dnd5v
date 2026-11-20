import { computed, ref } from 'vue'

import { readStoredMonster } from '../api/monsterStorage'
import { createEmptyMonster } from '../data/monster.mock'
import type { Monster } from '../types/monster'

const monster = ref<Monster | null>(null)

const savedSnapshot = ref<string | null>(null)

const isLoading = ref(true)

const loadError = ref<string | null>(null)

const saveError = ref<string | null>(null)

const isDirty = computed(
    () => monster.value !== null && JSON.stringify(monster.value) !== savedSnapshot.value,
)

export function useMonsterSheet() {
    function load() {
        isLoading.value = true
        loadError.value = null
        saveError.value = null
        try {
            const stored = readStoredMonster()

            monster.value = stored ?? createEmptyMonster()
            savedSnapshot.value = stored ? JSON.stringify(stored) : null
        } catch {
            loadError.value =
                'Не удалось загрузить монстра. Проверьте доступ к хранилищу и сохранённые данные.'
        } finally {
            isLoading.value = false
        }
    }

    function save() {
        if (!monster.value) return
        saveError.value = null
        try {
            // writeStoredMonster(monster.value)
            savedSnapshot.value = JSON.stringify(monster.value)
        } catch {
            saveError.value =
                'Не удалось сохранить монстра. Изменения остаются в открытом листе. Попробуйте ещё раз.'
        }
    }

    function createMonster() {
        monster.value = createEmptyMonster()
        savedSnapshot.value = null
        loadError.value = null
        isLoading.value = false
        save()
    }

    return {
        monster,
        isLoading,
        loadError,
        saveError,
        isDirty,
        load,
        save,
        createMonster,
    }
}
