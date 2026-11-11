import type { CharacterRuleset } from '../types/character.ts'

export const CHARACTER_RULESETS = ['2024'] as const satisfies readonly CharacterRuleset[]

export const DEFAULT_CHARACTER_RULESET: CharacterRuleset = '2024'

export function isCharacterRuleset(value: unknown): value is CharacterRuleset {
    return value === DEFAULT_CHARACTER_RULESET
}
