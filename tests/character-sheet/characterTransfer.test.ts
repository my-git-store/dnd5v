import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterTransfer, parseCharacterTransfer, serializeCharacterTransfer, transferFilename, uniqueCharacterId } from '../../src/modules/character-sheet/api/characterTransfer.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'

test('exports a sanitized v3 envelope with date and character data', () => {
  const character = migrateCharacterV2ToV3(createMockCharacter())
  character.extensions.secretToken = 'must-not-export'
  const exported = createCharacterTransfer([character], '2026-10-28T10:00:00.000Z')
  assert.equal(exported.schemaVersion, 3)
  assert.equal(exported.exportVersion, 1)
  assert.equal(exported.exportedAt, '2026-10-28T10:00:00.000Z')
  assert.equal((exported.characters[0]?.extensions as Record<string, unknown>).secretToken, undefined)
  assert.equal(exported.characters[0]?.identity.name, character.identity.name)
})

test('parses current transfer and migrates a legacy v2 character', () => {
  const legacy = createMockCharacter()
  const parsedLegacy = parseCharacterTransfer(JSON.stringify(legacy))
  assert.equal(parsedLegacy.characters[0]?.schemaVersion, 3)
  const current = migrateCharacterV2ToV3(legacy)
  const parsedCurrent = parseCharacterTransfer(serializeCharacterTransfer([current]))
  assert.equal(parsedCurrent.characters.length, 1)
  assert.equal(parsedCurrent.characters[0]?.id, current.id)
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
