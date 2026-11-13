import type { Character } from '@/types/character'
import { assertValidCharacter, InvalidCharacterError } from '@/validation/characterValidation'

export const CHARACTER_STORAGE_KEY = 'nastolka:character-sheet'

export interface CharacterStorageLike {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}

export class CharacterStorageError extends Error {
    cause?: unknown

    constructor(message: string, options?: { cause?: unknown }) {
        super(message)
        this.cause = options?.cause
        this.name = 'CharacterStorageError'
    }
}

function browserStorage(): CharacterStorageLike {
    if (typeof window === 'undefined')
        throw new CharacterStorageError('Локальное хранилище недоступно вне браузера.')
    return window.localStorage
}

export function readStoredCharacter(storage?: CharacterStorageLike): Character | null {
    try {
        const target = storage ?? browserStorage()

        let raw = target.getItem(CHARACTER_STORAGE_KEY)
        // Read the previously active character until the first save to the single slot.
        // Keep old entries untouched so switching storage never destroys a backup.
        if (raw === null) {
            const activeId = target.getItem('nastolka:character-sheet:active')
            if (activeId !== null && !activeId.trim()) return null
            raw =
                activeId !== null
                    ? target.getItem(`nastolka:character-sheet:${activeId}`)
                    : (target.getItem('nastolka:character-sheet:1') ??
                      target.getItem('nastolka:character-sheet:demo-character'))
        }
        if (raw === null) return null
        const value: unknown = JSON.parse(raw)
        assertValidCharacter(value)
        return value
    } catch (error) {
        throw new CharacterStorageError(
            error instanceof InvalidCharacterError || error instanceof CharacterStorageError
                ? error.message
                : 'Не удалось прочитать персонажа.',
            { cause: error },
        )
    }
}

export function writeStoredCharacter(character: Character, storage?: CharacterStorageLike): void {
    try {
        assertValidCharacter(character)
        const target = storage ?? browserStorage()
        target.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character))
    } catch (error) {
        throw new CharacterStorageError('Не удалось сохранить персонажа.', { cause: error })
    }
}
