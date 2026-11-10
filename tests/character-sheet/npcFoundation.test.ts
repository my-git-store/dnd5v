import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/api/characterSheetAdapter.ts'
import { createDefaultNpcProfile } from '../../src/modules/character-sheet/domain/npc.ts'
import { createEmptyCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { validateCharacter } from '../../src/modules/character-sheet/validation/characterValidation.ts'
import { createCharacterTransfer, parseCharacterTransfer } from '../../src/modules/character-sheet/api/characterTransfer.ts'
import type { CharacterStorageLike } from '../../src/modules/character-sheet/api/characterStorage.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()
  get length() { return this.values.size }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
  key(index: number) { return [...this.values.keys()][index] ?? null }
}

test('empty characters remain regular characters without NPC data', () => {
  const character = createEmptyCharacter('npc-check')
  assert.equal(character.kind, 'character')
  assert.equal(character.npc, undefined)
})

test('NPC profile validates and survives adapter roundtrip', async () => {
  const storage = new MemoryStorage()

  const adapter = createCharacterSheetAdapter({ storage })

  const view = await adapter.load('npc-roundtrip')

  const npc = createDefaultNpcProfile('Страж ворот')
  npc.abilities.dexterity = 14
  npc.features.push({ id: 'feature-1', name: 'Тёмное зрение', description: 'Видит в темноте.', attackBonus: '', damage: '' })
  npc.actions.push({ id: 'action-1', name: 'Удар', description: 'Рукопашная атака.', attackBonus: '+4', damage: '1d6+2' })
  view.kind = 'npc'
  view.name = npc.name
  view.npc = npc
  const saved = await adapter.save(view)
  assert.equal(saved.kind, 'npc')
  const current = createEmptyCharacter('npc-roundtrip')
  current.kind = 'npc'
  current.npc = npc
  assert.deepEqual(validateCharacter(current), [])
  const reloaded = await createCharacterSheetAdapter({ storage }).load('npc-roundtrip')
  assert.equal(reloaded.kind, 'npc')
  assert.equal(reloaded.npc?.features[0]?.name, 'Тёмное зрение')
  assert.equal(reloaded.npc?.actions[0]?.damage, '1d6+2')
})

test('NPC discriminator and entries remain present in export/import', () => {
  const source = createEmptyCharacter('npc-transfer')
  source.kind = 'npc'
  source.npc = createDefaultNpcProfile('Сторож')
  source.npc.actions.push({ id: 'bite', name: 'Укус', description: 'Атака.', attackBonus: '+3', damage: '1d6+1' })
  const imported = parseCharacterTransfer(JSON.stringify(createCharacterTransfer([source], '2026-10-28T00:00:00.000Z')))
  assert.equal(imported.characters[0]?.kind, 'npc')
  assert.equal(imported.characters[0]?.npc?.actions[0]?.damage, '1d6+1')
})
