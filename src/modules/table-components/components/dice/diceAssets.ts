import type { DiceSides } from '../../domain/dice.ts'

/**
 * One source image is kept for every supported die. The file names are part of
 * the UI mapping; the roll result itself remains owned by the dice domain.
 */
export const DICE_ASSET_FILES: Record<DiceSides, string> = {
  4: 'd4.png',
  6: 'd6.png',
  8: 'd8.png',
  10: 'd10.png',
  12: 'd12.png',
  20: 'd20.png',
  100: 'd100.png',
}

const DICE_ASSET_URLS: Record<DiceSides, string> = {
  4: new URL('../../assets/dice/d4.png', import.meta.url).href,
  6: new URL('../../assets/dice/d6.png', import.meta.url).href,
  8: new URL('../../assets/dice/d8.png', import.meta.url).href,
  10: new URL('../../assets/dice/d10.png', import.meta.url).href,
  12: new URL('../../assets/dice/d12.png', import.meta.url).href,
  20: new URL('../../assets/dice/d20.png', import.meta.url).href,
  100: new URL('../../assets/dice/d100.png', import.meta.url).href,
}

export function diceAssetFor(sides: DiceSides): string | undefined {
  return DICE_ASSET_URLS[sides]
}

export function diceAssetFileFor(sides: DiceSides): string | undefined {
  return DICE_ASSET_FILES[sides]
}
