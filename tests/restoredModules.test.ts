import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmptyCharacter } from '../src/data/character.mock.ts'
import { CHARACTER_STORAGE_KEY, writeStoredCharacter, readStoredCharacter } from '../src/api/characterStorage.ts'
import type { CharacterStorageLike } from '../src/api/characterStorage.ts'
import { MOCK_BESTIARY } from '../src/modules/bestiary/data/mockBestiary.ts'
import { createBestiaryAdapter } from '../src/modules/bestiary/api/bestiaryAdapter.ts'
import { bestiaryToNpc } from '../src/modules/bestiary/types/bestiary.ts'
import { DICE_TYPES, dieFaceLabel, isDiceSides, rollDie, resultLabel } from '../src/modules/table-components/domain/dice.ts'
import { DICE_ASSET_FILES, diceAssetFileFor } from '../src/modules/table-components/components/dice/diceAssets.ts'
import { currentParticipantIdAfterRemoval, currentParticipantIndex, nextTurnIndex, sortInitiative, type InitiativeParticipant } from '../src/modules/table-components/domain/initiative.ts'
import { parseDiceFormula, rollDiceFormula, numericBonus } from '../src/modules/table-components/domain/rollFormula.ts'

class MemoryStorage implements CharacterStorageLike {
    private readonly values = new Map<string, string>()
    getItem(key: string) { return this.values.get(key) ?? null }
    setItem(key: string, value: string) { this.values.set(key, value) }
    readonly length = 0
}

test('dice domain covers supported types and rejects unsupported sides', () => {
    assert.deepEqual(DICE_TYPES, [4, 6, 8, 10, 12, 20, 100])
    assert.equal(isDiceSides(20), true)
    assert.equal(isDiceSides(5), false)
    assert.throws(() => rollDie(5 as never), /Unsupported dice type/)
})

test('each supported die maps to its own image asset', () => {
    assert.deepEqual(DICE_TYPES.map(diceAssetFileFor), ['d4.png', 'd6.png', 'd8.png', 'd10.png', 'd12.png', 'd20.png', 'd100.png'])
    assert.equal(new Set(Object.values(DICE_ASSET_FILES)).size, DICE_TYPES.length)
})

test('dice roll stays in range and displayed result matches d100 result', () => {
    for (const sides of DICE_TYPES) {
        assert.equal(rollDie(sides, () => 0), 1)
        assert.equal(rollDie(sides, () => 0.999999), sides)
    }
    assert.equal(dieFaceLabel(100, 47), '47')
    assert.equal(resultLabel(100, 47), 'd100: 47')
})

test('attack and damage formula parser keeps localized and legacy formulas safe', () => {
    assert.deepEqual(parseDiceFormula('1к6 + 2'), { count: 1, sides: 6, modifier: 2 })
    assert.deepEqual(rollDiceFormula('d20+4', () => 0), { formula: 'd20+4', result: 5, dice: 1, modifier: 4 })
    assert.equal(numericBonus('+7'), 7)
    assert.equal(numericBonus('1d20+5'), null)
})

const participants: InitiativeParticipant[] = [
    { id: 'low', name: 'Воин', initiative: 10 },
    { id: 'high', name: 'Эллара', initiative: 18 },
    { id: 'mid', name: 'Гоблин', initiative: 14 },
]

test('initiative sorting is descending and does not mutate its source', () => {
    assert.deepEqual(sortInitiative(participants).map(item => item.id), ['high', 'mid', 'low'])
    assert.deepEqual(participants.map(item => item.id), ['low', 'high', 'mid'])
})

test('initiative transitions advance the round and survive empty lists', () => {
    assert.deepEqual(nextTurnIndex(0, 3), { index: 1, roundAdvanced: false })
    assert.deepEqual(nextTurnIndex(2, 3), { index: 0, roundAdvanced: true })
    assert.deepEqual(nextTurnIndex(0, 0), { index: -1, roundAdvanced: false })
    assert.equal(currentParticipantIndex(sortInitiative(participants), 'high'), 0)
    assert.equal(currentParticipantIdAfterRemoval(sortInitiative(participants), 'high', 'high'), 'mid')
})

test('bestiary adapter returns isolated records and converts to an editable NPC copy', () => {
    const adapter = createBestiaryAdapter(MOCK_BESTIARY)
    const original = adapter.list()[0]
    assert.ok(original?.environment.length)
    const copy = adapter.getById(original!.id)!
    copy.actions.push({ id: 'local', name: 'Своя запись', description: '', attackBonus: '', damage: '' })
    assert.equal(adapter.getById(original!.id)?.actions.some(action => action.id === 'local'), false)
    const npc = bestiaryToNpc(original!)
    npc.actions[0]!.name = 'Изменённая копия'
    assert.notEqual(npc.actions[0]?.name, original!.actions[0]?.name)
})

test('NPC profile and encounter round-trip without changing ordinary character fields', () => {
    const storage = new MemoryStorage()
    const character = createEmptyCharacter()
    character.identity.class = 'Воин'
    character.combat.hitPoints = { max: 24, current: 15, temporary: 2 }
    character.npc = bestiaryToNpc(MOCK_BESTIARY[0]!)
    character.encounters = [{
        id: 'encounter-1', name: 'У ворот', round: 2, currentParticipantId: 'guard-1',
        participants: [{ id: 'guard-1', sourceId: 'ashen-scout', name: 'Страж', maxHitPoints: 18, currentHitPoints: 11, armorClass: 13, initiative: 2, defeated: false }],
    }]
    writeStoredCharacter(character, storage)
    const restored = readStoredCharacter(storage)
    assert.equal(restored?.identity.class, 'Воин')
    assert.equal(restored?.combat.hitPoints.current, 15)
    assert.equal(restored?.npc?.name, character.npc.name)
    assert.equal(restored?.encounters?.[0]?.participants[0]?.currentHitPoints, 11)
    assert.equal(restored?.encounters?.[0]?.currentParticipantId, 'guard-1')
    assert.ok(storage.getItem(CHARACTER_STORAGE_KEY))
})

test('storage rejects duplicate encounter participant ids and HP above maximum', () => {
    const character = createEmptyCharacter()
    character.encounters = [{
        id: 'encounter-1', name: 'Столкновение', round: 1, currentParticipantId: null,
        participants: [
            { id: 'same', name: 'Страж 1', maxHitPoints: 4, currentHitPoints: 2, armorClass: 10, initiative: 0, defeated: false },
            { id: 'same', name: 'Страж 2', maxHitPoints: 4, currentHitPoints: 5, armorClass: 10, initiative: 0, defeated: false },
        ],
    }]
    assert.throws(() => writeStoredCharacter(character, new MemoryStorage()), /Не удалось сохранить персонажа/)
})

test('legacy versioned records remain untouched when current character is saved', () => {
    const storage = new MemoryStorage()
    const legacy = '{"schemaVersion":3,"kind":"npc","name":"Legacy"}'
    storage.setItem('nastolka:character-sheet:v3:legacy', legacy)
    const character = createEmptyCharacter()
    writeStoredCharacter(character, storage)
    assert.equal(storage.getItem('nastolka:character-sheet:v3:legacy'), legacy)
    assert.equal(readStoredCharacter(storage)?.identity.level, 1)
})
