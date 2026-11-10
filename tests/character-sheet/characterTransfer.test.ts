import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterTransfer, parseCharacterTransfer, serializeCharacterTransfer, transferFilename, uniqueCharacterId } from '../../src/modules/character-sheet/api/characterTransfer.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'

test('exports a sanitized current envelope with date and character data', () => {
  const character = createMockCharacter()
  character.extensions.secretToken = 'must-not-export'
  const exported = createCharacterTransfer([character], '2026-10-28T10:00:00.000Z')
  assert.equal(exported.schemaVersion, 3)
  assert.equal(exported.exportVersion, 1)
  assert.equal(exported.exportedAt, '2026-10-28T10:00:00.000Z')
  assert.equal((exported.characters[0]?.extensions as Record<string, unknown>).secretToken, undefined)
  assert.equal(exported.characters[0]?.identity.name, character.identity.name)
})

test('parses the current transfer envelope', () => {
  const character = createMockCharacter()

  const parsedCharacter = parseCharacterTransfer(JSON.stringify(character))
  assert.equal(parsedCharacter.characters[0]?.schemaVersion, 3)

  const parsedCurrent = parseCharacterTransfer(serializeCharacterTransfer([character]))
  assert.equal(parsedCurrent.characters.length, 1)
  assert.equal(parsedCurrent.characters[0]?.id, character.id)
})

test('rejects malformed, unsupported and oversized imports before storage changes', () => {
  assert.throws(() => parseCharacterTransfer('{broken'), /некорректный JSON/i)
  assert.throws(() => parseCharacterTransfer(JSON.stringify({ schemaVersion: 2, exportVersion: 1, characters: [] })), /версия пакета/i)
  assert.throws(() => parseCharacterTransfer('x'.repeat(2 * 1024 * 1024 + 1)), /слишком большой/i)
})

test('resolves duplicate ids without overwriting existing characters and creates safe filenames', () => {
  assert.equal(uniqueCharacterId('hero', ['hero'], 'fixed'), 'hero-import-fixed')
  assert.equal(uniqueCharacterId('hero', [], 'fixed'), 'hero')
  assert.equal(transferFilename('Элара Лунный Свет', new Date('2026-10-28T00:00:00Z')), 'Элара-Лунный-Свет-2026-10-28.json')
})
