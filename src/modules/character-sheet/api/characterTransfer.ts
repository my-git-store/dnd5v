import { listStoredCharacterIds, readStoredCharacterV3, type CharacterStorageLike } from './characterV3Storage.ts'
import { migrateCharacterToV3 } from '../migration/characterMigrationV3.ts'
import { cloneCharacterV3, type CharacterV3 } from '../types/characterV3.ts'

export const CHARACTER_TRANSFER_MAX_BYTES = 2 * 1024 * 1024

export interface CharacterTransferEnvelope {
  schemaVersion: 3
  exportVersion: 1
  exportedAt: string
  characters: CharacterV3[]
}

export interface ImportedCharacterPlan {
  characters: CharacterV3[]
  exportedAt?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function safeCharacter(character: CharacterV3): CharacterV3 {
  const next = cloneCharacterV3(character)
  const creation = next.extensions && typeof next.extensions.characterCreation === 'object'
    ? clone(next.extensions.characterCreation)
    : undefined
  next.extensions = creation === undefined ? {} : { characterCreation: creation }
  return next
}

export function createCharacterTransfer(characters: CharacterV3[], exportedAt = new Date().toISOString()): CharacterTransferEnvelope {
  return {
    schemaVersion: 3,
    exportVersion: 1,
    exportedAt,
    characters: characters.map(safeCharacter),
  }
}

export function serializeCharacterTransfer(characters: CharacterV3[], exportedAt = new Date().toISOString()): string {
  return JSON.stringify(createCharacterTransfer(characters, exportedAt), null, 2)
}

export function parseCharacterTransfer(raw: string): ImportedCharacterPlan {
  const bytes = new TextEncoder().encode(raw).byteLength
  if (bytes > CHARACTER_TRANSFER_MAX_BYTES) throw new Error('Файл импорта слишком большой.')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch {
    throw new Error('Файл импорта содержит некорректный JSON.')
  }
  if (!isRecord(parsed)) throw new Error('Файл импорта должен содержать объект персонажа или пакет персонажей.')

  const exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined
  if (Array.isArray(parsed.characters) && (parsed.schemaVersion !== 3 || parsed.exportVersion !== 1)) {
    throw new Error('Неподдерживаемая версия пакета персонажей.')
  }
  const sourceCharacters = Array.isArray(parsed.characters) ? parsed.characters : [parsed]
  if (sourceCharacters.length === 0) throw new Error('В файле нет персонажей.')
  if (sourceCharacters.length > 100) throw new Error('В одном файле можно импортировать не более 100 персонажей.')

  const characters = sourceCharacters.map((value, index) => {
    try {
      return migrateCharacterToV3(value)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'неизвестная ошибка'
      throw new Error(`Персонаж ${index + 1}: ${message}`)
    }
  })
  return { characters, exportedAt }
}

export function readAllStoredCharacters(storage: CharacterStorageLike): CharacterV3[] {
  return listStoredCharacterIds(storage).flatMap((id) => {
    const character = readStoredCharacterV3(id, storage)
    return character ? [character] : []
  })
}

export function transferFilename(name: string, date = new Date()): string {
  const safeName = name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'personazh'
  const stamp = date.toISOString().slice(0, 10)
  return `${safeName}-${stamp}.json`
}

export function uniqueCharacterId(baseId: string, usedIds: Iterable<string>, randomId = globalThis.crypto?.randomUUID?.()): string {
  const used = new Set(usedIds)
  if (!used.has(baseId)) return baseId
  const suffix = randomId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${baseId}-import-${suffix}`
}
