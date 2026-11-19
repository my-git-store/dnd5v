import type { Character } from '@/types/character'

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

export function readStoredCharacter(storage?: CharacterStorageLike) {
    try {
        const target = storage ?? browserStorage()

        const raw = target.getItem(CHARACTER_STORAGE_KEY)
        if (raw === null) return null
        const value: Character = JSON.parse(raw)
        if (value === undefined) return null

        return value
    } catch {
        console.log('Не удалось прочитать персонажа.')
    }
}

export function writeStoredCharacter(character: Character, storage?: CharacterStorageLike): void {
    try {
        const target = storage ?? browserStorage()
        target.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character))
    } catch (error) {
        throw new CharacterStorageError('Не удалось сохранить персонажа.', { cause: error })
    }
}
