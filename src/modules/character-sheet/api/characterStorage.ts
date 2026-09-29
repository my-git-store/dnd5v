import { cloneCharacter, type Character } from '../types/character'
import { assertValidCharacter } from '../validation/characterValidation'

const STORAGE_PREFIX = 'nastolka:character-sheet:v1:'

export class CharacterStorageError extends Error {
  cause?: unknown
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    if (options?.cause !== undefined) this.cause = options.cause
    this.name = 'CharacterStorageError'
  }
}

export function readStoredCharacter(id: string): Character | null {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`)
    if (raw === null) return null
    const value: unknown = JSON.parse(raw)
    assertValidCharacter(value)
    return cloneCharacter(value)
  } catch (error) {
    if (error instanceof CharacterStorageError) throw error
    throw new CharacterStorageError('Не удалось прочитать сохранённого персонажа.', { cause: error })
  }
}

export function writeStoredCharacter(character: Character): Character {
  try {
    assertValidCharacter(character)
    const value = cloneCharacter(character)
    window.localStorage.setItem(`${STORAGE_PREFIX}${character.id}`, JSON.stringify(value))
    return cloneCharacter(value)
  } catch (error) {
    if (error instanceof CharacterStorageError) throw error
    throw new CharacterStorageError('Не удалось сохранить персонажа.', { cause: error })
  }
}
