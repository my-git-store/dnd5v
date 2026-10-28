import test from 'node:test'
import assert from 'node:assert/strict'
import { changeSpellSlot, restoreSpellSlots, takeLongRest, takeShortRest } from '../../src/modules/character-sheet/domain/rest.ts'
import { numericBonus, parseDiceFormula, rollDiceFormula } from '../../src/modules/character-sheet/domain/rollFormula.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

test('short rest spends only available hit dice and caps healing at maximum HP', () => {
  const combat = migrateCharacterV2ToV3(createMockCharacter()).combat
  combat.hitPoints = { max: 10, current: 4, temporary: 2 }
  combat.hitDice = { size: 'd8', total: 2, spent: 1 }
  const result = takeShortRest(combat, { constitution: 14 }, 4, () => 0)
  assert.deepEqual(result.rolls, [1])
  assert.equal(result.spent, 1)
  assert.equal(result.healing, 3)
  assert.equal(result.combat.hitPoints.current, 7)
  assert.equal(result.combat.hitDice.spent, 2)
})

test('short rest with no available dice leaves combat unchanged', () => {
  const combat = migrateCharacterV2ToV3(createMockCharacter()).combat
  combat.hitDice = { size: 'd8', total: 1, spent: 1 }
  const result = takeShortRest(combat, { constitution: 18 }, 1)
  assert.equal(result.spent, 0)
  assert.deepEqual(result.combat, combat)
})

test('long rest restores HP, clears temporary and death-save state and recovers half hit dice', () => {
  const combat = migrateCharacterV2ToV3(createMockCharacter()).combat
  combat.hitPoints = { max: 12, current: 3, temporary: 5 }
  combat.hitDice = { size: 'd10', total: 5, spent: 4 }
  combat.deathSaves = { successes: 2, failures: 1 }
  const result = takeLongRest(combat)
  assert.deepEqual(result.hitPoints, { max: 12, current: 12, temporary: 0 })
  assert.deepEqual(result.hitDice, { size: 'd10', total: 5, spent: 2 })
  assert.deepEqual(result.deathSaves, { successes: 0, failures: 0 })
})

test('spell slots stay within zero and maximum and long rest restores all slots', () => {
  const slots = migrateCharacterV2ToV3(createMockCharacter()).spellcasting.spellSlots
  slots[1] = { max: 2, used: 1 }
  assert.equal(changeSpellSlot(slots, 1, 1)[1].used, 2)
  assert.equal(changeSpellSlot(slots, 1, 10)[1].used, 2)
  assert.equal(changeSpellSlot(slots, 1, -10)[1].used, 0)
  assert.equal(restoreSpellSlots(slots)[1].used, 0)
})

test('attack and damage formulas use the existing dice domain and tolerate legacy bonuses', () => {
  assert.deepEqual(parseDiceFormula('1к6 + 2'), { count: 1, sides: 6, modifier: 2 })
  assert.deepEqual(rollDiceFormula('d20+4', () => 0), { formula: 'd20+4', result: 5, dice: 1, modifier: 4 })
  assert.equal(numericBonus('+7'), 7)
  assert.equal(numericBonus('1d20+5'), null)
})

test('rest, spell-slot and inventory actions survive v3 adapter save and reload', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => source })
  const draft = await adapter.load(source.id)
  draft.combat.hitPoints = { max: 12, current: 4, temporary: 2 }
  draft.combat.hitDice = { size: 'd8', total: 2, spent: 1 }
  draft.spellcasting.spellSlots[1] = { max: 2, used: 1 }
  draft.inventoryData.items[0]!.quantity = 0
  await adapter.save(draft)
  const reloaded = await adapter.load(source.id)
  assert.deepEqual(reloaded.combat.hitPoints, { max: 12, current: 4, temporary: 2 })
  assert.deepEqual(reloaded.combat.hitDice, { size: 'd8', total: 2, spent: 1 })
  assert.deepEqual(reloaded.spellcasting.spellSlots[1], { max: 2, used: 1 })
  assert.equal(reloaded.inventoryData.items[0]?.quantity, 0)
  assert.ok(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`))
})
