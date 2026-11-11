import { cloneCharacter, type Character, type CharacterRuleset } from '../types/character.ts'
import { assertValidCharacter, InvalidCharacterError } from '../validation/characterValidation.ts'

export const CHARACTER_STORAGE_PREFIX = 'nastolka:character-sheet:'
export const CHARACTER_INDEX_STORAGE_KEY = 'nastolka:character-sheet:index'
export const CHARACTER_ACTIVE_STORAGE_KEY = 'nastolka:character-sheet:active'

export interface CharacterStorageLike {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem?(key: string): void
    readonly length?: number
    key?(index: number): string | null
}

export interface StoredCharacterSummary {
    id: string
    name: string
    className: string
    ruleset: CharacterRuleset
    kind: 'character' | 'npc'
}

export class CharacterStorageError extends Error {
    cause?: unknown

    constructor(message: string, options?: { cause?: unknown }) {
        super(message)
        if (options?.cause !== undefined) this.cause = options.cause
        this.name = 'CharacterStorageError'
    }
}

function browserStorage(): CharacterStorageLike {
    if (typeof window === 'undefined')
        throw new CharacterStorageError('Локальное хранилище недоступно вне браузера.')
    return window.localStorage
}

function readIndexedIds(storage: CharacterStorageLike): string[] {
    const raw = storage.getItem(CHARACTER_INDEX_STORAGE_KEY)
    if (raw === null) return []
    try {
        const value: unknown = JSON.parse(raw)
        return Array.isArray(value)
            ? [
                  ...new Set(
                      value.filter(
                          (id): id is string => typeof id === 'string' && id.trim().length > 0,
                      ),
                  ),
              ]
            : []
    } catch {
        return []
    }
}

function discoverStorageIds(storage: CharacterStorageLike): string[] {
    const ids = new Set(readIndexedIds(storage))
    if (typeof storage.length === 'number' && storage.key) {
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index)
            if (key?.startsWith(CHARACTER_STORAGE_PREFIX)) {
                const id = key.slice(CHARACTER_STORAGE_PREFIX.length)
                if (id && id !== 'index' && id !== 'active') ids.add(id)
            }
        }
    }
    return [...ids]
}

function writeIndexedIds(ids: string[], storage: CharacterStorageLike): void {
    storage.setItem(CHARACTER_INDEX_STORAGE_KEY, JSON.stringify([...new Set(ids.filter(Boolean))]))
}

/** Returns undefined when no active choice has been recorded, and null for an explicit empty state. */
export function readStoredActiveCharacterId(
    storage: CharacterStorageLike = browserStorage(),
): string | null | undefined {
    const value = storage.getItem(CHARACTER_ACTIVE_STORAGE_KEY)
    if (value === null) return undefined
    return value.trim() || null
}

export function writeStoredActiveCharacterId(
    id: string | null,
    storage: CharacterStorageLike = browserStorage(),
): void {
    storage.setItem(CHARACTER_ACTIVE_STORAGE_KEY, id ?? '')
}

export function listStoredCharacterIds(storage: CharacterStorageLike = browserStorage()): string[] {
    return discoverStorageIds(storage)
}

export function listStoredCharacterSummaries(
    storage: CharacterStorageLike = browserStorage(),
): StoredCharacterSummary[] {
    return listStoredCharacterIds(storage).flatMap(id => {
        let character: Character | null
        try {
            character = readStoredCharacter(id, storage)
        } catch {
            return []
        }
        if (!character) return []
        return [
            {
                id,
                name: character.identity.name,
                className: character.identity.class,
                ruleset: character.ruleset,
                kind: character.kind === 'npc' ? 'npc' : 'character',
            },
        ]
    })
}

export function removeStoredCharacter(
    id: string,
    storage: CharacterStorageLike = browserStorage(),
): void {
    storage.removeItem?.(`${CHARACTER_STORAGE_PREFIX}${id}`)
    writeIndexedIds(
        discoverStorageIds(storage).filter(storedId => storedId !== id),
        storage,
    )
    if (readStoredActiveCharacterId(storage) === id) writeStoredActiveCharacterId(null, storage)
}

export function readStoredCharacter(
    id: string,
    storage: CharacterStorageLike = browserStorage(),
): Character | null {
    try {
        const raw = storage.getItem(`${CHARACTER_STORAGE_PREFIX}${id}`)
        if (raw === null) return null
        const value: unknown = JSON.parse(raw) as unknown
        assertValidCharacter(value)
        return cloneCharacter(value)
    } catch (error) {
        if (error instanceof CharacterStorageError) throw error
        throw new CharacterStorageError(
            error instanceof InvalidCharacterError
                ? error.message
                : 'Не удалось прочитать персонажа.',
            { cause: error },
        )
    }
}

export function writeStoredCharacter(
    character: Character,
    storage: CharacterStorageLike = browserStorage(),
): Character {
    try {
        assertValidCharacter(character)
        const value = cloneCharacter(character)
        storage.setItem(`${CHARACTER_STORAGE_PREFIX}${character.id}`, JSON.stringify(value))
        writeIndexedIds([...discoverStorageIds(storage), character.id], storage)
        writeStoredActiveCharacterId(character.id, storage)
        return cloneCharacter(value)
    } catch (error) {
        if (error instanceof CharacterStorageError) throw error
        throw new CharacterStorageError('Не удалось сохранить персонажа.', { cause: error })
    }
}
