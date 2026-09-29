import { createMockCharacter } from '../data/character.mock'
import { cloneCharacter, type Character } from '../types/character'
import { readStoredCharacter, writeStoredCharacter } from './characterStorage'
import { assertValidCharacter } from '../validation/characterValidation'

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
let loadErrorConsumed = false

function shouldFailFirstLoad(): boolean {
  if (typeof window === 'undefined' || loadErrorConsumed) return false
  const enabled = new URLSearchParams(window.location.search).get('mockLoadError') === 'once'
  if (!enabled) return false
  loadErrorConsumed = true
  return true
}

export async function getMockCharacter(id: string): Promise<Character> {
  await delay(500)
  if (shouldFailFirstLoad()) throw new Error('Тестовая ошибка загрузки. Нажмите «Повторить».')
  const stored = readStoredCharacter(id)
  return stored ? cloneCharacter(stored) : createMockCharacter()
}

export async function saveMockCharacter(character: Character): Promise<Character> {
  await delay(500)
  assertValidCharacter(character)
  return writeStoredCharacter(character)
}
