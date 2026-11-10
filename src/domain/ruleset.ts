import { isRules2024SpellId } from '../data/rules2024/index.ts'
import { cloneCharacter, type Character, type CharacterRuleset } from '../types/character.ts'

/** Supported rulesets. Keep this list as the single runtime source of truth. */
export const CHARACTER_RULESETS = ['2014', '2024'] as const satisfies readonly CharacterRuleset[]

export const DEFAULT_CHARACTER_RULESET: CharacterRuleset = '2014'

export function isCharacterRuleset(value: unknown): value is CharacterRuleset {
    return typeof value === 'string' && CHARACTER_RULESETS.includes(value as CharacterRuleset)
}

/** Applies the 2024 ruleset to the current character record without changing its schema. */
export function promoteCharacterTo2024(character: Character): Character {
    const next = cloneCharacter(character)
    next.ruleset = '2024'
    next.spellcasting.spellRuleset = '2024'
    next.spellcasting.spellIds = [
        ...new Set(next.spellcasting.knownSpells.map(spell => spell.id).filter(isRules2024SpellId)),
    ]
    next.spellcasting.cantripIds = [
        ...new Set(next.spellcasting.cantrips.map(spell => spell.id).filter(isRules2024SpellId)),
    ]
    next.origin = {
        species: character.origin.species || character.identity.race.name,
        background: character.origin.background || character.identity.background.name,
        ...(character.origin.featId ? { featId: character.origin.featId } : {}),
        originFeat: character.origin.originFeat,
        languages: character.origin.languages.length
            ? [...character.origin.languages]
            : [...character.identity.race.languages],
        tools: character.origin.tools.length
            ? [...character.origin.tools]
            : [...character.identity.background.toolProficiencies],
    }
    return next
}
