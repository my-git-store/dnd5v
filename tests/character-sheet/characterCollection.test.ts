import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { createEmptyCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { CHARACTER_ACTIVE_STORAGE_KEY, CHARACTER_INDEX_STORAGE_KEY, CHARACTER_V3_STORAGE_PREFIX, listStoredCharacterSummaries, readStoredActiveCharacterId, removeStoredCharacter, type CharacterStorageLike, writeStoredActiveCharacterId } from '../../src/modules/character-sheet/api/characterV3Storage.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  get length() { return this.values.size }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  key(index: number) { return [...this.values.keys()][index] ?? null }
}

test('new characters use safe empty defaults and persist all edited sections after reload', async () => {
  const storage = new MemoryStorage()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async (id) => createEmptyCharacter(id) })

  const created = await adapter.load('new-character')
  assert.equal(created.id, 'new-character')
  assert.equal(created.class, '')
  assert.deepEqual(created.inventory, [])
  assert.deepEqual(created.spells, [])
  created.name = 'Лира'
  created.combat.hitPoints = { max: 18, current: 12, temporary: 2 }
  created.spellcasting.spellSlots[1] = { max: 2, used: 1 }
  created.feats = [{ id: 'feat-1', name: 'Наблюдатель', description: 'Видит детали.' }]
  created.inventoryData.items = [{ id: 'item-1', name: 'Факел', quantity: 2, weight: 1, description: 'Светит.', equipped: false, properties: [] }]
  created.inventory = [{ id: 'item-1', name: 'Факел', quantity: 2, description: 'Светит.' }]
  created.skills[0]!.additionalBonus = 2
  created.spells = [{ id: 'spell-1', name: 'Щит', level: 1, description: 'Защита.' }]
  const saved = await adapter.save(created)

  const reloaded = await createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } }).load(saved.id)
  assert.equal(reloaded.name, 'Лира')
  assert.deepEqual(reloaded.combat.hitPoints, { max: 18, current: 12, temporary: 2 })
  assert.deepEqual(reloaded.spellcasting.spellSlots[1], { max: 2, used: 1 })
  assert.deepEqual(reloaded.feats, [{ id: 'feat-1', name: 'Наблюдатель', description: 'Видит детали.' }])
  assert.equal(reloaded.inventoryData.items[0]?.quantity, 2)
  assert.equal(reloaded.skills[0]?.additionalBonus, 2)
})

test('character index supports listing, copying under a new id and deletion', async () => {
  const storage = new MemoryStorage()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async (id) => createEmptyCharacter(id) })
  const first = await adapter.load('first')
  first.name = 'Первый'
  await adapter.save(first)
  const second = await adapter.load('second')
  second.name = 'Второй'
  await adapter.save(second)

  let summaries = listStoredCharacterSummaries(storage)
  assert.deepEqual(summaries.map((item) => item.id), ['first', 'second'])
  assert.deepEqual(JSON.parse(storage.getItem(CHARACTER_INDEX_STORAGE_KEY)!), ['first', 'second'])

  const copy = { ...second, id: 'second-copy', name: 'Второй (копия)' }
  await adapter.save(copy)
  summaries = listStoredCharacterSummaries(storage)
  assert.equal(summaries.some((item) => item.id === 'second-copy' && item.name === 'Второй (копия)'), true)
  assert.notEqual(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}second`), null)

  removeStoredCharacter('second', storage)
  assert.equal(listStoredCharacterSummaries(storage).some((item) => item.id === 'second'), false)
  assert.notEqual(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}first`), null)
})

test('legacy v2 records remain readable and appear in the character list', () => {
  const storage = new MemoryStorage()
  const legacy = migrateCharacterV2ToV3(createEmptyCharacter('legacy'))
  storage.setItem('nastolka:character-sheet:v2:legacy', JSON.stringify({ ...createEmptyCharacter('legacy'), schemaVersion: 2 }))
  const summaries = listStoredCharacterSummaries(storage)
  assert.deepEqual(summaries, [{ id: 'legacy', name: 'Новый персонаж', className: '', ruleset: '2014' }])
  assert.equal(legacy.schemaVersion, 3)
})

test('active character selection survives reload and supports an explicit empty state', () => {
  const storage = new MemoryStorage()
  assert.equal(readStoredActiveCharacterId(storage), undefined)
  writeStoredActiveCharacterId('second', storage)
  assert.equal(storage.getItem(CHARACTER_ACTIVE_STORAGE_KEY), 'second')
  assert.equal(readStoredActiveCharacterId(storage), 'second')
  writeStoredActiveCharacterId(null, storage)
  assert.equal(readStoredActiveCharacterId(storage), null)
})
