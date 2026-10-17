import test from 'node:test'
import assert from 'node:assert/strict'
import { currentParticipantIdAfterRemoval, currentParticipantIndex, nextTurnIndex, sortInitiative, type InitiativeParticipant } from '../../src/modules/table-components/domain/initiative.ts'

const participants: InitiativeParticipant[] = [
  { id: 'low', name: 'Воин', initiative: 10 },
  { id: 'high', name: 'Эллара', initiative: 18 },
  { id: 'mid', name: 'Гоблин', initiative: 14 },
]

test('adds and sorts initiative participants by descending initiative', () => {
  const sorted = sortInitiative([...participants, { id: 'new', name: 'Друид', initiative: 20 }])
  assert.deepEqual(sorted.map((item) => item.id), ['new', 'high', 'mid', 'low'])
  assert.deepEqual(participants.map((item) => item.id), ['low', 'high', 'mid'])
})

test('moves to the next participant and advances the round at the end', () => {
  assert.deepEqual(nextTurnIndex(0, 3), { index: 1, roundAdvanced: false })
  assert.deepEqual(nextTurnIndex(2, 3), { index: 0, roundAdvanced: true })
  assert.deepEqual(nextTurnIndex(-1, 0), { index: -1, roundAdvanced: false })
})

test('keeps the current participant stable when sorting changes', () => {
  const sorted = sortInitiative([...participants, { id: 'new', name: 'Друид', initiative: 20 }])
  assert.equal(currentParticipantIndex(sorted, 'high'), 1)
})

test('chooses a nearby participant when the current one is removed', () => {
  const sorted = sortInitiative(participants)
  assert.equal(currentParticipantIdAfterRemoval(sorted, 'high', 'high'), 'mid')
  assert.equal(currentParticipantIdAfterRemoval(sorted, 'high', 'low'), 'high')
})

test('empty and removal flows remain safe', () => {
  assert.deepEqual(sortInitiative([]), [])
  assert.deepEqual(nextTurnIndex(0, 0), { index: -1, roundAdvanced: false })
})
