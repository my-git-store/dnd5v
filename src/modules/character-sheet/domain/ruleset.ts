import type { CharacterRuleset } from '../types/characterV3.ts'

/** Supported rulesets. Keep this list as the single runtime source of truth. */
export const CHARACTER_RULESETS = ['2014', '2024'] as const satisfies readonly CharacterRuleset[]

export const DEFAULT_CHARACTER_RULESET: CharacterRuleset = '2014'

export function isCharacterRuleset(value: unknown): value is CharacterRuleset {
  return typeof value === 'string' && CHARACTER_RULESETS.includes(value as CharacterRuleset)
}
