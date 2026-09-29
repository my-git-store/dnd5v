import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'

test('mock character factory returns independent copies', () => {
  const first = createMockCharacter()
  const second = createMockCharacter()
  first.name = 'Изменён'
  first.inventory[0]!.quantity = 99
  assert.equal(second.name, 'Элара Лунный Свет')
  assert.equal(second.inventory[0]!.quantity, 1)
})
