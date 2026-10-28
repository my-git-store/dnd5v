import test from 'node:test'
import assert from 'node:assert/strict'
import { MOCK_BESTIARY } from '../../src/modules/bestiary/data/mockBestiary.ts'
import { createBestiaryAdapter } from '../../src/modules/bestiary/api/bestiaryAdapter.ts'
import { bestiaryToNpc } from '../../src/modules/bestiary/types.ts'

test('mock bestiary exposes stable typed entries and adapter returns independent copies', () => {
  const adapter = createBestiaryAdapter(MOCK_BESTIARY)
  const first = adapter.list()[0]
  assert.ok(first)
  assert.ok(first.id)
  assert.ok(first.name)
  assert.ok(first.environment.length)
  const copy = adapter.getById(first.id)
  assert.ok(copy)
  copy!.actions.push({ id: 'local', name: 'Локальная правка', description: '', attackBonus: '', damage: '' })
  assert.equal(adapter.getById(first.id)!.actions.some((action) => action.id === 'local'), false)
})

test('bestiary entry creates an independent editable NPC profile', () => {
  const entry = MOCK_BESTIARY[0]!
  const npc = bestiaryToNpc(entry)
  assert.equal(npc.name, entry.name)
  assert.equal(npc.armorClass.value, entry.armorClass)
  assert.equal(npc.hitPoints.current, entry.hitPoints)
  assert.equal(npc.initiative.mode, 'manual')
  assert.equal(npc.initiative.value, entry.initiative)
  npc.actions[0]!.name = 'Изменённое действие'
  assert.notEqual(npc.actions[0]!.name, entry.actions[0]!.name)
})
