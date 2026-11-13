import type { DiceSides } from '@/domain/dice'

export { DICE_TYPES, isDiceSides, rollDie, type DiceSides } from '@/domain/dice'

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
