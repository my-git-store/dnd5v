import { migrateCharacterToV3 } from '../migration/characterMigrationV3.ts'
import { cloneCharacterV3, type CharacterV3 } from '../types/characterV3.ts'
import { assertValidCharacterV3 } from '../validation/characterV3Validation.ts'

export const CHARACTER_V3_STORAGE_PREFIX = 'nastolka:character-sheet:v3:'
export const CHARACTER_V2_STORAGE_PREFIX = 'nastolka:character-sheet:v2:'
export const CHARACTER_V1_STORAGE_PREFIX = 'nastolka:character-sheet:v1:'

export interface CharacterStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type CharacterV3StorageSource = 'v1' | 'v2' | 'v3'

export interface CharacterV3StorageRead {
  character: CharacterV3
  source: CharacterV3StorageSource
}

export class CharacterV3StorageError extends Error {
  cause?: unknown

  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    if (options?.cause !== undefined) this.cause = options.cause
    this.name = 'CharacterV3StorageError'
  }
}

function browserStorage(): CharacterStorageLike {
  if (typeof window === 'undefined') throw new CharacterV3StorageError('Локальное хранилище недоступно вне браузера.')
  return window.localStorage
}

export function readStoredCharacterV3WithSource(id: string, storage: CharacterStorageLike = browserStorage()): CharacterV3StorageRead | null {
  try {
    const candidates: Array<{ key: string; source: CharacterV3StorageSource }> = [
      { key: `${CHARACTER_V3_STORAGE_PREFIX}${id}`, source: 'v3' },
      { key: `${CHARACTER_V2_STORAGE_PREFIX}${id}`, source: 'v2' },
      { key: `${CHARACTER_V1_STORAGE_PREFIX}${id}`, source: 'v1' },
    ]
    const candidate = candidates.find(({ key }) => storage.getItem(key) !== null)
    if (candidate === undefined) return null
    const raw = storage.getItem(candidate.key)
    if (raw === null) return null
    return { character: cloneCharacterV3(migrateCharacterToV3(JSON.parse(raw) as unknown)), source: candidate.source }
  } catch (error) {
    if (error instanceof CharacterV3StorageError) throw error
    throw new CharacterV3StorageError('Не удалось прочитать персонажа v3.', { cause: error })
  }
}

export function readStoredCharacterV3(id: string, storage: CharacterStorageLike = browserStorage()): CharacterV3 | null {
  return readStoredCharacterV3WithSource(id, storage)?.character ?? null
}

export function writeStoredCharacterV3(character: CharacterV3, storage: CharacterStorageLike = browserStorage()): CharacterV3 {
  try {
    assertValidCharacterV3(character)
    const value = cloneCharacterV3(character)
    storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`, JSON.stringify(value))
    return cloneCharacterV3(value)
  } catch (error) {
    if (error instanceof CharacterV3StorageError) throw error
    throw new CharacterV3StorageError('Не удалось сохранить персонажа v3.', { cause: error })
  }
}
