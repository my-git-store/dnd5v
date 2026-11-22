import test from 'node:test'
import assert from 'node:assert/strict'
import { createEmptyCharacter } from '../src/data/character.mock.ts'
import { changeSpellSlot, restoreSpellSlots, takeLongRest, takeShortRest } from '../src/domain/rest.ts'
import { readStoredCharacter, writeStoredCharacter, CHARACTER_STORAGE_KEY } from '../src/api/characterStorage.ts'
import type { CharacterStorageLike } from '../src/api/characterStorage.ts'

class MemoryStorage implements CharacterStorageLike {
    private readonly values = new Map<string, string>()
    getItem(key: string) { return this.values.get(key) ?? null }
    setItem(key: string, value: string) { this.values.set(key, value) }
    readonly length = 0
}

test('short rest spends only available hit dice and caps healing at maximum HP', () => {
    const character = createEmptyCharacter()
    character.combat.hitPoints = { max: 10, current: 4, temporary: 2 }
    character.combat.hitDice = { size: 'd8', total: 2, spent: 1 }
    const result = takeShortRest(character.combat, { constitution: 14 }, 4, () => 0)
    assert.deepEqual(result.rolls, [1])
    assert.equal(result.spent, 1)
    assert.equal(result.healing, 3)
    assert.equal(result.combat.hitPoints.current, 7)
    assert.equal(result.combat.hitDice.spent, 2)
    assert.equal(character.combat.hitPoints.current, 4)
})

test('short rest with no available dice leaves combat unchanged', () => {
    const character = createEmptyCharacter()
    character.combat.hitDice = { size: 'd8', total: 1, spent: 1 }
    const result = takeShortRest(character.combat, { constitution: 18 }, 1)
    assert.equal(result.spent, 0)
    assert.deepEqual(result.combat, character.combat)
})

test('long rest restores 2024 hit dice, HP and resets temporary and death-save state', () => {
    const character = createEmptyCharacter()
    character.combat.hitPoints = { max: 12, current: 3, temporary: 5 }
    character.combat.hitDice = { size: 'd10', total: 5, spent: 4 }
    character.combat.deathSaves = { successes: 2, failures: 1 }
    const result = takeLongRest(character.combat)
    assert.deepEqual(result.hitPoints, { max: 12, current: 12, temporary: 0 })
    assert.deepEqual(result.hitDice, { size: 'd10', total: 5, spent: 0 })
    assert.deepEqual(result.deathSaves, { successes: 0, failures: 0 })
})

test('spell slots stay within zero and maximum and long rest restores all slots', () => {
    const slots = createEmptyCharacter().spellcasting.spellSlots
    slots[1] = { max: 2, used: 1 }
    assert.equal(changeSpellSlot(slots, 1, 1)[1].used, 2)
    assert.equal(changeSpellSlot(slots, 1, 10)[1].used, 2)
    assert.equal(changeSpellSlot(slots, 1, -10)[1].used, 0)
    assert.equal(restoreSpellSlots(slots)[1].used, 0)
})

test('rest and spell-slot changes survive storage reload', () => {
    const storage = new MemoryStorage()
    const character = createEmptyCharacter()
    character.combat.hitPoints = { max: 12, current: 4, temporary: 2 }
    character.combat.hitDice = { size: 'd8', total: 2, spent: 1 }
    character.spellcasting.spellSlots[1] = { max: 2, used: 1 }
    writeStoredCharacter(character, storage)
    const restored = readStoredCharacter(storage)
    assert.deepEqual(restored?.combat.hitPoints, { max: 12, current: 4, temporary: 2 })
    assert.deepEqual(restored?.combat.hitDice, { size: 'd8', total: 2, spent: 1 })
    assert.deepEqual(restored?.spellcasting.spellSlots[1], { max: 2, used: 1 })
    assert.ok(storage.getItem(CHARACTER_STORAGE_KEY))
})

test('spell-slot restore preserves each maximum while clearing usage', () => {
    const slots = createEmptyCharacter().spellcasting.spellSlots
    slots[1] = { max: 4, used: 3 }
    slots[2] = { max: 2, used: 2 }
    assert.deepEqual(restoreSpellSlots(slots), { ...slots, 1: { max: 4, used: 0 }, 2: { max: 2, used: 0 } })
})
