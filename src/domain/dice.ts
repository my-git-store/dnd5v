export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const
export type DiceSides = (typeof DICE_TYPES)[number]

export function isDiceSides(value: number): value is DiceSides {
    return (DICE_TYPES as readonly number[]).includes(value)
}

export function rollDie(sides: DiceSides, random = Math.random): number {
    if (!isDiceSides(sides)) throw new Error('Unsupported dice type.')
    return Math.floor(random() * sides) + 1
}

