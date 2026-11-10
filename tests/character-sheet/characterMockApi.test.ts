import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmptyCharacter, createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'

test('mock character factory returns independent copies', () => {
  const first = createMockCharacter()

  const second = createMockCharacter()
  first.identity.name = 'Изменён'
  first.inventory.items[0]!.quantity = 99
  assert.equal(second.identity.name, 'Элара Лунный Свет')
  assert.equal(second.inventory.items[0]!.quantity, 1)
})

test('empty character factory does not invent a class or progression selection', () => {
  const empty = createEmptyCharacter()

  assert.equal(empty.identity.class, '')
  assert.deepEqual(empty.progression?.classLevels, [])
  assert.deepEqual(empty.inventory.items, [])
})
