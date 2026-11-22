import { computed, ref } from 'vue'

import {
    copyCompatibleRecord,
    createCompatibleNpc,
    deleteCompatibleRecord,
    findCompatibleRecord,
    getActiveCompatibleCharacterId,
    getActiveCompatibleNpcId,
    listCompatibleRecords,
    migrateCompatibleStorage,
    saveCompatibleRecord,
    setActiveCompatibleCharacterId,
    setActiveCompatibleNpcId,
    type CompatibleRecord,
    type StorageIssue,
} from '@/api/characterCollectionCompat'
import { createEmptyCharacter } from '@/data/character.mock'
import { createDefaultNpcProfile } from '@/domain/npc'
import type { Character, CharacterNpc } from '@/types/character'

interface StoredCharacterSummary {
    id: string
    name: string
    className: string
    ruleset: '2014' | '2024'
}

const internalCollectionEnabled = import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_CHARACTER_MANAGER === 'true'
const internalNpcEnabled = import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_NPC_COLLECTION === 'true'
const internalTransferEnabled = import.meta.env.DEV &&
    import.meta.env.VITE_ENABLE_CHARACTER_TRANSFER === 'true'

const character = ref<Character | null>(null)
const savedSnapshot = ref<string | null>(null)
const activeId = ref<string | null>(null)
const characters = ref<StoredCharacterSummary[]>([])
const npcRecords = ref<CompatibleRecord[]>([])
const activeNpc = ref<Character | null>(null)
const activeNpcId = ref<string | null>(null)
const npcSavedSnapshot = ref<string | null>(null)
const collectionIssues = ref<StorageIssue[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const saveError = ref<string | null>(null)
const storageWarning = ref<string | null>(null)
const isDirty = computed(
    () => character.value !== null && JSON.stringify(character.value) !== savedSnapshot.value,
)
const isNpcDirty = computed(
    () => activeNpc.value !== null && JSON.stringify(activeNpc.value) !== npcSavedSnapshot.value,
)

function toSummary(record: CompatibleRecord): StoredCharacterSummary {
    const value = record.character
    return {
        id: record.id,
        name: value.identity.name?.trim() || value.identity.class || 'Новый персонаж',
        className: value.identity.class || 'Класс не выбран',
        ruleset: value.ruleset === '2014' ? '2014' : '2024',
    }
}

function updateCompatibilityLists(): void {
    const result = listCompatibleRecords()
    characters.value = result.characters.map(toSummary)
    npcRecords.value = result.npcs
    collectionIssues.value = result.issues
    storageWarning.value = result.issues.length
        ? `Найдены записи, требующие проверки: ${result.issues[0]?.message ?? 'исходные данные оставлены без изменений.'}`
        : null
}

function setActiveRecord(record: CompatibleRecord | null): void {
    activeId.value = record?.id ?? null
    character.value = record ? JSON.parse(JSON.stringify(record.character)) as Character : null
    savedSnapshot.value = character.value ? JSON.stringify(character.value) : null
    if (record) setActiveCompatibleCharacterId(record.id)
}

function setActiveNpcRecord(record: CompatibleRecord | null): void {
    activeNpcId.value = record?.id ?? null
    activeNpc.value = record ? JSON.parse(JSON.stringify(record.character)) as Character : null
    npcSavedSnapshot.value = activeNpc.value ? JSON.stringify(activeNpc.value) : null
    if (record) setActiveCompatibleNpcId(record.id)
}

export function useCharacterSheet() {
    function load(targetId?: string | null) {
        isLoading.value = true
        loadError.value = null
        saveError.value = null
        try {
            // The public UI shows only one active character, but it still reads and
            // writes through the compatibility adapter so older collections and
            // NPC records are not hidden behind a blank single-record view.
            const result = migrateCompatibleStorage()
            characters.value = result.characters.map(toSummary)
            npcRecords.value = result.npcs
            collectionIssues.value = result.issues
            storageWarning.value = result.issues.length
                ? `Найдены записи, требующие проверки: ${result.issues[0]?.message ?? 'исходные данные оставлены без изменений.'}`
                : null
            const requestedId = targetId === undefined ? getActiveCompatibleCharacterId() : targetId
            const preferred = result.characters.find(record => record.id === requestedId)
                ?? result.characters[0]
                ?? null
            setActiveRecord(preferred)
            if (!preferred) setActiveCompatibleCharacterId(null)
            if (internalNpcEnabled) {
                const requestedNpcId = getActiveCompatibleNpcId()
                setActiveNpcRecord(result.npcs.find(record => record.id === requestedNpcId) ?? result.npcs[0] ?? null)
            } else {
                activeNpc.value = null
                activeNpcId.value = null
                npcSavedSnapshot.value = null
            }
        } catch (error) {
            character.value = null
            savedSnapshot.value = null
            loadError.value = error instanceof Error
                ? `Не удалось безопасно восстановить данные: ${error.message} Исходные записи сохранены.`
                : 'Не удалось загрузить персонажа. Исходные записи сохранены.'
        } finally {
            isLoading.value = false
        }
    }

    function save(): boolean | undefined {
        if (!character.value) return
        try {
            const result = saveCompatibleRecord(character.value, undefined, 'character')
            activeId.value = result.id
            updateCompatibilityLists()
            savedSnapshot.value = JSON.stringify(character.value)
            saveError.value = null
            return true
        } catch {
            saveError.value = 'Не удалось сохранить изменения. Они остались на странице; попробуйте ещё раз.'
            return false
        }
    }

    function createCharacter(): void {
        character.value = createEmptyCharacter()
        savedSnapshot.value = null
        loadError.value = null
        saveError.value = null
        activeId.value = character.value.id ?? null
        const saved = save()
        if (saved) setActiveCompatibleCharacterId(activeId.value)
    }

    function selectCharacter(id: string): boolean {
        if (!internalCollectionEnabled || !id || id === activeId.value || isDirty.value) return false
        const record = findCompatibleRecord(id, 'character')
        if (!record) return false
        setActiveRecord(record)
        loadError.value = null
        updateCompatibilityLists()
        return true
    }

    function copyCharacter(): boolean {
        if (!internalCollectionEnabled || !character.value || isDirty.value) return false
        const record = findCompatibleRecord(activeId.value ?? character.value.id ?? '', 'character')
        if (!record) return false
        try {
            const copy = copyCompatibleRecord(record)
            setActiveRecord(copy)
            updateCompatibilityLists()
            return true
        } catch { return false }
    }

    function deleteCharacter(id = activeId.value): boolean {
        if (!internalCollectionEnabled || !id || (id === activeId.value && isDirty.value)) return false
        try {
            deleteCompatibleRecord(id, 'character')
            updateCompatibilityLists()
            if (activeId.value === id) {
                const next = findCompatibleRecord(characters.value[0]?.id ?? '', 'character')
                setActiveRecord(next)
            }
            return true
        } catch { return false }
    }

    function refreshCollection(): void {
        updateCompatibilityLists()
    }

    function selectNpc(id: string): boolean {
        if (!internalNpcEnabled || !id || id === activeNpcId.value || isNpcDirty.value) return false
        const record = findCompatibleRecord(id, 'npc')
        if (!record) return false
        setActiveNpcRecord(record)
        updateCompatibilityLists()
        return true
    }

    function createNpc(profile: CharacterNpc = createDefaultNpcProfile()): boolean {
        if (!internalNpcEnabled || isNpcDirty.value) return false
        try {
            const npc = createCompatibleNpc(profile)
            const record = saveCompatibleRecord(npc, undefined, 'npc')
            setActiveNpcRecord(record)
            updateCompatibilityLists()
            return true
        } catch { return false }
    }

    function saveNpc(): boolean {
        if (!internalNpcEnabled || !activeNpc.value) return false
        try {
            const record = saveCompatibleRecord(activeNpc.value, undefined, 'npc')
            activeNpcId.value = record.id
            npcSavedSnapshot.value = JSON.stringify(activeNpc.value)
            updateCompatibilityLists()
            return true
        } catch { return false }
    }

    function copyNpc(): boolean {
        if (!internalNpcEnabled || !activeNpc.value || isNpcDirty.value) return false
        const record = findCompatibleRecord(activeNpcId.value ?? '', 'npc')
        if (!record) return false
        try {
            setActiveNpcRecord(copyCompatibleRecord(record))
            updateCompatibilityLists()
            return true
        } catch { return false }
    }

    function deleteNpc(id = activeNpcId.value): boolean {
        if (!internalNpcEnabled || !id || (id === activeNpcId.value && isNpcDirty.value)) return false
        try {
            deleteCompatibleRecord(id, 'npc')
            updateCompatibilityLists()
            if (activeNpcId.value === id) {
                const next = findCompatibleRecord(npcRecords.value[0]?.id ?? '', 'npc')
                setActiveNpcRecord(next)
            }
            return true
        } catch { return false }
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
        internalCollectionEnabled,
        internalNpcEnabled,
        internalTransferEnabled,
        characters,
        activeId,
        npcRecords,
        activeNpc,
        activeNpcId,
        isNpcDirty,
        collectionIssues,
        selectCharacter,
        copyCharacter,
        deleteCharacter,
        refreshCollection,
        selectNpc,
        createNpc,
        saveNpc,
        copyNpc,
        deleteNpc,
    }
}
