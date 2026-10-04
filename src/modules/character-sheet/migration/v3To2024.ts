import { cloneCharacterV3, type CharacterV3 } from '../types/characterV3.ts'
import { isRules2024SpellId } from '../data/rules2024/index.ts'

/**
 * Promotes an existing v3 character to the 2024 ruleset without rewriting
 * scores or collections. The creation flow can later replace the legacy
 * origin choices explicitly; this helper is intentionally non-destructive.
 */
export function migrateV3To2024(character: CharacterV3): CharacterV3 {
  const next = cloneCharacterV3(character)
  next.ruleset = '2024'
  next.spellcasting.spellRuleset = '2024'
  next.spellcasting.spellIds = [...new Set(next.spellcasting.knownSpells.map((spell) => spell.id).filter(isRules2024SpellId))]
  next.spellcasting.cantripIds = [...new Set(next.spellcasting.cantrips.map((spell) => spell.id).filter(isRules2024SpellId))]
  next.origin = {
    species: character.origin.species || character.identity.race.name,
    background: character.origin.background || character.identity.background.name,
    ...(character.origin.featId ? { featId: character.origin.featId } : {}),
    originFeat: character.origin.originFeat,
    languages: [...(character.origin.languages.length ? character.origin.languages : character.identity.race.languages)],
    tools: [...(character.origin.tools.length ? character.origin.tools : character.identity.background.toolProficiencies)],
  }
  return next
}
