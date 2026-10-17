import test from 'node:test'
import assert from 'node:assert/strict'
import { DICE_TYPES, dieFaceLabel, isDiceSides, resultLabel, rollDie } from '../../src/modules/table-components/domain/dice.ts'
import { DICE_ASSET_FILES, diceAssetFileFor } from '../../src/modules/table-components/components/dice/diceAssets.ts'

test('supports the requested dice types', () => {
  assert.deepEqual(DICE_TYPES, [4, 6, 8, 10, 12, 20, 100])
  assert.equal(isDiceSides(20), true)
  assert.equal(isDiceSides(5), false)
})

test('maps every supported die to its own visual asset', () => {
  assert.deepEqual(DICE_TYPES.map((sides) => diceAssetFileFor(sides)), [
    'd4.png',
    'd6.png',
    'd8.png',
    'd10.png',
    'd12.png',
    'd20.png',
    'd100.png',
  ])
  assert.equal(new Set(Object.values(DICE_ASSET_FILES)).size, DICE_TYPES.length)
})

test('rollDie returns an inclusive result in the selected range', () => {
  for (const sides of DICE_TYPES) {
    assert.equal(rollDie(sides, () => 0), 1)
    assert.equal(rollDie(sides, () => 0.999999), sides)
    for (let index = 0; index < 25; index += 1) {
      const result = rollDie(sides)
      assert.ok(result >= 1 && result <= sides)
    }
  }
})

test('result label stays tied to the die that produced the result', () => {
  assert.equal(resultLabel(20, 17), 'd20: 17')
  assert.equal(resultLabel(6, null), 'Результат пока не выбран.')
})

test('d100 face matches the exact domain result', () => {
  assert.equal(dieFaceLabel(100, 1), '1')
  assert.equal(dieFaceLabel(100, 47), '47')
  assert.equal(dieFaceLabel(100, 100), '100')
  assert.equal(dieFaceLabel(20, 20), '20')
})
