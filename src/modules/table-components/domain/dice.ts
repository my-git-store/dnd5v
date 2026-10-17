export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const
export type DiceSides = typeof DICE_TYPES[number]

export function isDiceSides(value: number): value is DiceSides {
  return (DICE_TYPES as readonly number[]).includes(value)
}

export function rollDie(sides: DiceSides, random = Math.random): number {
  if (!isDiceSides(sides)) throw new Error('Unsupported dice type.')
  return Math.floor(random() * sides) + 1
}

export function diceLabel(sides: DiceSides): string {
  return `d${sides}`
}

export function resultLabel(sides: DiceSides, result: number | null): string {
  return result === null ? 'Результат пока не выбран.' : `${diceLabel(sides)}: ${result}`
}

/** Label shown on the die face. It always matches the domain result, including d100. */
export function dieFaceLabel(_sides: DiceSides, result: number | null): string {
  if (result === null) return '—'
  return String(result)
}
