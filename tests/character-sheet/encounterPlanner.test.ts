import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { createEmptyCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'
import type { CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()
  get length() { return this.values.size }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  key(index: number) { return [...this.values.keys()][index] ?? null }
}

test('old v3 payloads without encounters remain valid', () => {
  const old = migrateCharacterV2ToV3(createEmptyCharacter('legacy-encounter'))
  assert.equal(validateCharacterV3(old).length, 0)
  assert.equal(old.encounters, undefined)
})

test('encounters round-trip through the existing v3 adapter', async () => {
  const storage = new MemoryStorage()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async (id) => createEmptyCharacter(id) })
  const view = await adapter.load('encounter-roundtrip')
  view.encounters = [{ id: 'encounter-1', name: 'У ворот', round: 2, currentParticipantId: 'guard-1', participants: [{ id: 'guard-1', sourceId: 'ashen-scout', name: 'Страж 1', maxHitPoints: 18, currentHitPoints: 11, armorClass: 13, initiative: 2, defeated: false }] }]
  await adapter.save(view)
  const restored = await createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } }).load('encounter-roundtrip')
  assert.equal(restored.encounters?.[0]?.name, 'У ворот')
  assert.equal(restored.encounters?.[0]?.participants[0]?.currentHitPoints, 11)
  assert.equal(restored.encounters?.[0]?.currentParticipantId, 'guard-1')
})

test('encounter validation rejects duplicate participant ids and out of range HP', () => {
  const value = migrateCharacterV2ToV3(createEmptyCharacter('invalid-encounter'))
  value.encounters = [{ id: 'encounter-1', name: 'Бой', round: 1, currentParticipantId: null, participants: [
    { id: 'same', name: 'A', maxHitPoints: 4, currentHitPoints: 5, armorClass: 10, initiative: 0, defeated: false },
    { id: 'same', name: 'B', maxHitPoints: 4, currentHitPoints: 2, armorClass: 10, initiative: 0, defeated: false },
  ] }]
  assert.ok(validateCharacterV3(value).some((error) => error.includes('столкновений')))
})
