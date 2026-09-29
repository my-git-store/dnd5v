import { getMockCharacter, saveMockCharacter } from './characterMockApi'
import type { Character } from '../types/character'

export interface CharacterApi {
  getCharacter(id: string): Promise<Character>
  saveCharacter(character: Character): Promise<Character>
}

const mockApi: CharacterApi = { getCharacter: getMockCharacter, saveCharacter: saveMockCharacter }

export const characterApi: CharacterApi = mockApi
export const getCharacter = (id: string) => characterApi.getCharacter(id)
export const saveCharacter = (character: Character) => characterApi.saveCharacter(character)
