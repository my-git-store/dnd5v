import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { validateCharacter } from '../../src/modules/character-sheet/validation/characterValidation.ts'

test('mock character satisfies schema v1', () => {
  assert.deepEqual(validateCharacter(createMockCharacter()), [])
})

test('validation rejects an empty name and negative money', () => {
  const character = createMockCharacter()
  character.name = ' '
  character.money.gold = -1
  assert.ok(validateCharacter(character).length > 0)
})
