import type { AbilityKey, CharacterGender } from './character.ts'
import type { CharacterRuleset } from './characterV3.ts'

/** Shared vocabulary for future rule data. Existing v3 source fields stay compatible. */
export type RuleSourceKind =
  | 'species'
  | 'race'
  | 'class'
  | 'background'
  | 'feat'
  | 'manual'
  | 'equipment'
  | 'spell'
  | 'temporary-effect'

export interface RuleSourceRef {
  kind: RuleSourceKind
  id: string
  label?: string
}

export type RuleEffectType = 'ability-bonus' | 'proficiency' | 'speed' | 'armor-class' | 'spellcasting' | 'custom'
export type RuleEffectDuration = 'permanent' | 'temporary' | 'until-rest' | 'until-long-rest'

/** Contract only: effects are not evaluated by the current prototype. */
export interface RuleEffectDescriptor {
  source: RuleSourceRef
  type: RuleEffectType
  value: number | string
  duration?: RuleEffectDuration
}

/** One class entry in the progression envelope. Multiple entries are reserved for multiclassing. */
export interface ClassLevelEntry {
  classId: string
  level: number
}

/** Metadata for future ASI/feat choices; this prototype does not apply either choice. */
export interface ProgressionChoiceMetadata {
  abilityScoreImprovementLevels: number[]
  featChoiceLevels: number[]
}

/** A reference to a feature acquired at a particular character level. */
export interface ProgressionFeatureGain {
  featureId: string
  level: number
  source: RuleSourceRef
}

/** A persisted audit entry for an explicit level-up operation. */
export interface ProgressionHistoryEntry {
  fromLevel: number
  toLevel: number
  gainedFeatures: ProgressionFeatureGain[]
  choices: Record<string, string[]>
}

/** Metadata contract for a future class, feat, or ASI selection. */
export interface ChoiceDefinition {
  id: string
  name: string
  options: string[]
  source: RuleSourceRef
}

/** Additive progression envelope. It stores references and choices, never evaluated effects. */
export interface CharacterProgressionV3 {
  level: number
  classLevels: ClassLevelEntry[]
  features: string[]
  choices: Record<string, string[]>
  /** References gained through an explicit level-up operation. */
  gainedFeatures?: ProgressionFeatureGain[]
  /** Append-only history of explicit level-up operations. */
  history?: ProgressionHistoryEntry[]
  choiceMetadata?: ProgressionChoiceMetadata
  /** Compatibility alias for an early, not-yet-persisted placeholder contract. */
  featureIds?: string[]
}

export type CharacterProgression = CharacterProgressionV3

export interface RulesetTaggedDefinition {
  id: string
  ruleset: CharacterRuleset
}

export type FeatCategory = 'origin' | 'general' | 'class' | 'species'
export type FeatEffectType = 'abilityBonus' | 'proficiency' | 'language' | 'feature'

/** Catalog metadata only; the sheet does not evaluate feat effects yet. */
export interface FeatEffectMetadata {
  type: FeatEffectType
  source: string
  target?: string
  requiresChoice?: boolean
}

export interface FeatDefinition extends RulesetTaggedDefinition {
  name: string
  description: string
  source: 'background' | 'species' | 'class'
  category: FeatCategory
  prerequisites: string[]
  effectsMetadata: FeatEffectMetadata[]
}

/** Class/species/feat feature metadata. Effects remain data-only for now. */
export type FeatureCategory = 'class' | 'subclass' | 'choice' | 'passive'

export interface FeatureDefinition extends RulesetTaggedDefinition {
  name: string
  description: string
  source: RuleSourceKind
  category: FeatureCategory
  prerequisites?: string[]
  level: number
  classId: string
  metadata: Record<string, unknown>
}

export type WeaponCategory = 'melee' | 'ranged'

/** Canonical weapon metadata. Mastery is a reference only; no combat effect is evaluated yet. */
export interface WeaponDefinition extends RulesetTaggedDefinition {
  name: string
  category: WeaponCategory
  damage: string
  damageType: string
  properties: string[]
  mastery: string | null
}

/** Weapon mastery metadata is intentionally descriptive until a combat rules layer exists. */
export interface WeaponMasteryDefinition {
  id: string
  name: string
  description: string
}

/** Canonical spell metadata. Effects and progression are intentionally not evaluated. */
export interface SpellDefinition extends RulesetTaggedDefinition {
  name: string
  level: number
  school: string
  classes: string[]
  castingTime: string
  range: string
  components: string
  duration: string
  description: string
  metadata: Record<string, unknown>
}

export type RuleChoiceKind = 'trait' | 'language' | 'ability' | 'proficiency'

export interface RuleChoice {
  id: string
  kind: RuleChoiceKind
  label: string
  description: string
  options: string[]
  minSelections: number
  maxSelections: number
}

/** A small, catalogue-agnostic equipment choice contract. */
export interface RuleEquipmentOption {
  id: string
  label: string
  items: Array<{
    name: string
    quantity: number
    description: string
    weight?: number | null
    properties?: string[]
  }>
}

export type SpellProgressionType = 'none' | 'prepared' | 'known' | 'pact'

/** Metadata contract for future class progression; it has no runtime effects yet. */
export interface RuleFeatureMetadata {
  id: string
  level: number
  label: string
}

/** Canonical class definition shared by future ruleset catalogues. */
export interface ClassDefinition extends RulesetTaggedDefinition {
  name: string
  /** Optional portrait asset. Older class records can omit it safely. */
  icon?: string
  /** Portrait variants keyed by the builder's presentation gender. */
  iconByGender?: Partial<Record<CharacterGender, string>>
  description: string
  hitDie: string
  primaryAbilities: AbilityKey[]
  savingThrowProficiencies: AbilityKey[]
  skillChoices: { count: number; options: string[] }
  weaponProficiencies: string[]
  armorProficiencies: string[]
  startingEquipment: RuleEquipmentOption[]
  levelFeaturesMetadata: RuleFeatureMetadata[]
  /** Canonical feature references; descriptions live in FeatureDefinition. */
  featureIds?: string[]
}
