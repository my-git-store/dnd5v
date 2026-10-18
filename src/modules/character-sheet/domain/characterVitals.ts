import { abilityModifier } from './abilityModifier.ts'
import type { CharacterSheetView } from '../types/characterView.ts'
import type { AbilityKey } from '../types/character.ts'
import type { CharacterSpellSlotsV3 } from '../types/characterV3.ts'

type CreationClassVitals = {
  hitDie: string
  spellcastingAbility: AbilityKey | null
}

function emptySpellSlots(): CharacterSpellSlotsV3 {
  return {
    1: { max: 0, used: 0 }, 2: { max: 0, used: 0 }, 3: { max: 0, used: 0 },
    4: { max: 0, used: 0 }, 5: { max: 0, used: 0 }, 6: { max: 0, used: 0 },
    7: { max: 0, used: 0 }, 8: { max: 0, used: 0 }, 9: { max: 0, used: 0 },
  }
}

function hitDieMaximum(value: string): number {
  const sides = Number(value.match(/^d(\d+)$/i)?.[1] ?? 0)
  return Number.isFinite(sides) && sides > 0 ? sides : 0
}

/** Initializes only the empty character created at level one; existing manual values are preserved. */
export function initializeCharacterVitals(character: CharacterSheetView, classOption: CreationClassVitals, isNewCharacter: boolean): void {
  if (!isNewCharacter) return

  const constitutionModifier = abilityModifier(character.abilities.constitution)
  const hitDie = hitDieMaximum(classOption.hitDie)
  if (character.combat.hitPoints.max <= 0 && character.combat.hitPoints.current <= 0 && hitDie > 0) {
    const hitPoints = Math.max(1, hitDie + constitutionModifier)
    character.combat.hitPoints = { ...character.combat.hitPoints, max: hitPoints, current: hitPoints }
  }
  if (character.combat.hitDice.total <= 0 && character.combat.hitDice.spent <= 0 && hitDie > 0) {
    character.combat.hitDice = { ...character.combat.hitDice, size: classOption.hitDie, total: 1, spent: 0 }
  }

  const slots = character.spellcasting.spellSlots
  const noExistingSlots = Object.values(slots).every((slot) => slot.max === 0 && slot.used === 0)
  if (noExistingSlots && classOption.spellcastingAbility) {
    character.spellcasting.spellSlots = emptySpellSlots()
    character.spellcasting.spellSlots[1] = { max: 2, used: 0 }
  }
}
