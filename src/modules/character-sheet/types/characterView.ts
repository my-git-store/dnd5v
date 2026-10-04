import type { AbilityKey, Character, CharacterAttack, CharacterSkill } from './character.ts'
import type { BackgroundProfileV3, CharacterCalculationMode, CharacterCombatV3, CharacterCreationV3, CharacterInventoryV3, CharacterOriginV3, CharacterPersonalityV3, CharacterProficiencyV3, CharacterRuleset, CharacterSavingThrowsV3, CharacterSpellcastingV3, RaceProfileV3, SkillProficiencySource } from './characterV3.ts'
import type { CharacterProgressionV3 } from './rules.ts'

export interface CharacterSkillView extends CharacterSkill {
  calculationMode: CharacterCalculationMode
  additionalBonus: number
  proficiencySources?: SkillProficiencySource[]
}

export interface CharacterAttackView extends CharacterAttack {
  kind: 'melee' | 'ranged' | 'spell' | 'other'
  proficient: boolean
  calculationMode: CharacterCalculationMode
  damageType: string
  properties: string[]
  range: string
  weaponMastery?: string
  weaponId?: string
  masteryId?: string
}

export interface CharacterSheetView extends Omit<Character, 'skills' | 'attacks'> {
  ruleset: CharacterRuleset
  origin: CharacterOriginV3
  skills: CharacterSkillView[]
  attacks: CharacterAttackView[]
  combat: CharacterCombatV3
  spellcasting: CharacterSpellcastingV3
  inventoryData: CharacterInventoryV3
  personality: CharacterPersonalityV3
  race: RaceProfileV3
  subclass: string
  background: BackgroundProfileV3
  alignment: string
  savingThrows: CharacterSavingThrowsV3
  proficiency: CharacterProficiencyV3
  features?: string[]
  progression?: CharacterProgressionV3
  creation?: CharacterCreationV3
}

export interface CharacterIdentityPatch {
  name?: string
  raceName?: string
  className?: string
  subclass?: string
  backgroundName?: string
  alignment?: string
  level?: number
  experience?: number
}

export type CharacterSkillPatch = Partial<Pick<CharacterSkillView, 'value' | 'ability' | 'proficiency' | 'calculationMode' | 'additionalBonus'>>
export type CharacterSavingThrowPatch = Partial<CharacterSheetView['savingThrows'][AbilityKey]>

export function cloneCharacterView(character: CharacterSheetView): CharacterSheetView {
  return JSON.parse(JSON.stringify(character)) as CharacterSheetView
}
