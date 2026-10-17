import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmptyCharacter, createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'

test('mock character factory returns independent copies', () => {
  const first = createMockCharacter()
  const second = createMockCharacter()
  first.name = 'Изменён'
  first.inventory[0]!.quantity = 99
  assert.equal(second.name, 'Элара Лунный Свет')
  assert.equal(second.inventory[0]!.quantity, 1)
})

test('empty character factory does not invent a class or progression selection', () => {
  const empty = migrateCharacterV2ToV3(createEmptyCharacter())

  assert.equal(empty.identity.class, '')
  assert.deepEqual(empty.progression?.classLevels, [])
  assert.deepEqual(empty.inventory.items, [])
})
