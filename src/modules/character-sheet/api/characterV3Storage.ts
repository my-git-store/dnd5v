import { migrateCharacterToV3 } from '../migration/characterMigrationV3.ts'
import { cloneCharacterV3, type CharacterV3 } from '../types/characterV3.ts'
import { assertValidCharacterV3 } from '../validation/characterV3Validation.ts'

export const CHARACTER_V3_STORAGE_PREFIX = 'nastolka:character-sheet:v3:'
export const CHARACTER_V2_STORAGE_PREFIX = 'nastolka:character-sheet:v2:'
export const CHARACTER_V1_STORAGE_PREFIX = 'nastolka:character-sheet:v1:'
export const CHARACTER_INDEX_STORAGE_KEY = 'nastolka:character-sheet:v3:index'
export const CHARACTER_ACTIVE_STORAGE_KEY = 'nastolka:character-sheet:v3:active'

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
  ruleset: '2014' | '2024'
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

function readIndexedIds(storage: CharacterStorageLike): string[] {
  const raw = storage.getItem(CHARACTER_INDEX_STORAGE_KEY)
  if (raw === null) return []
  try {
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))] : []
  } catch {
    return []
  }
}

function discoverStorageIds(storage: CharacterStorageLike): string[] {
  const ids = new Set(readIndexedIds(storage))
  if (typeof storage.length === 'number' && storage.key) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (!key) continue
      if (key === CHARACTER_INDEX_STORAGE_KEY || key === CHARACTER_ACTIVE_STORAGE_KEY) continue
      for (const prefix of [CHARACTER_V3_STORAGE_PREFIX, CHARACTER_V2_STORAGE_PREFIX, CHARACTER_V1_STORAGE_PREFIX]) {
        if (key.startsWith(prefix)) {
          const id = key.slice(prefix.length)
          if (id) ids.add(id)
        }
      }
    }
  }
  return [...ids]
}

function writeIndexedIds(ids: string[], storage: CharacterStorageLike): void {
  storage.setItem(CHARACTER_INDEX_STORAGE_KEY, JSON.stringify([...new Set(ids.filter(Boolean))]))
}

/** Returns undefined when no active choice has been recorded, and null for an explicit empty state. */
export function readStoredActiveCharacterId(storage: CharacterStorageLike = browserStorage()): string | null | undefined {
  const value = storage.getItem(CHARACTER_ACTIVE_STORAGE_KEY)
  if (value === null) return undefined
  return value.trim() || null
}

export function writeStoredActiveCharacterId(id: string | null, storage: CharacterStorageLike = browserStorage()): void {
  if (id === null) {
    storage.setItem(CHARACTER_ACTIVE_STORAGE_KEY, '')
    return
  }
  storage.setItem(CHARACTER_ACTIVE_STORAGE_KEY, id)
}

/** Returns all character ids known to the local storage index or legacy keys. */
export function listStoredCharacterIds(storage: CharacterStorageLike = browserStorage()): string[] {
  return discoverStorageIds(storage)
}

/** Returns lightweight list data without exposing the stored character payload. */
export function listStoredCharacterSummaries(storage: CharacterStorageLike = browserStorage()): StoredCharacterSummary[] {
  return listStoredCharacterIds(storage).flatMap((id) => {
    const stored = readStoredCharacterV3WithSource(id, storage)
    if (!stored) return []
    return [{ id, name: stored.character.identity.name, className: stored.character.identity.class, ruleset: stored.character.ruleset }]
  })
}

/** Removes one character while leaving unrelated and legacy storage entries intact. */
export function removeStoredCharacter(id: string, storage: CharacterStorageLike = browserStorage()): void {
  storage.removeItem?.(`${CHARACTER_V3_STORAGE_PREFIX}${id}`)
  storage.removeItem?.(`${CHARACTER_V2_STORAGE_PREFIX}${id}`)
  storage.removeItem?.(`${CHARACTER_V1_STORAGE_PREFIX}${id}`)
  writeIndexedIds(discoverStorageIds(storage).filter((storedId) => storedId !== id), storage)
  if (readStoredActiveCharacterId(storage) === id) writeStoredActiveCharacterId(null, storage)
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
    writeIndexedIds([...discoverStorageIds(storage), character.id], storage)
    writeStoredActiveCharacterId(character.id, storage)
    return cloneCharacterV3(value)
  } catch (error) {
    if (error instanceof CharacterV3StorageError) throw error
    throw new CharacterV3StorageError('Не удалось сохранить персонажа v3.', { cause: error })
  }
}
