import { DICE_TYPES, rollDie, type DiceSides } from '../../table-components/domain/dice.ts'

export interface FormulaRollResult {
  formula: string
  result: number
  dice: number
  modifier: number
}

const FORMULA_PATTERN = /^\s*(\d+)?\s*[dдк](\d+)\s*(?:([+-])\s*(\d+))?\s*$/i

export function parseDiceFormula(formula: string): { count: number; sides: DiceSides; modifier: number } | null {
  const match = FORMULA_PATTERN.exec(formula)
  if (!match) return null
  const count = Math.max(1, Math.min(20, Number(match[1] ?? 1)))
  const sides = Number(match[2]) as DiceSides
  if (!DICE_TYPES.includes(sides)) return null
  const amount = Number(match[4] ?? 0)
  return { count, sides, modifier: match[3] === '-' ? -amount : amount }
}

export function rollDiceFormula(formula: string, random = Math.random): FormulaRollResult | null {
  const parsed = parseDiceFormula(formula)
  if (!parsed) return null
  let dice = 0
  for (let index = 0; index < parsed.count; index += 1) dice += rollDie(parsed.sides, random)
  return { formula, result: dice + parsed.modifier, dice, modifier: parsed.modifier }
}

export function numericBonus(value: string): number | null {
  const trimmed = value.trim()
  if (!/^[+-]?\d+$/.test(trimmed)) return null
  return Number(trimmed)
}
