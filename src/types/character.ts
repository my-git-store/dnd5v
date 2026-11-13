export type AbilityKey =
    'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

export type CharacterAbilities = Record<AbilityKey, number>
export type AttackBonusSource = AbilityKey | 'manual'
export type SkillProficiency = 'none' | 'proficient' | 'expertise'
/** Presentation choice used by the character builder for class portraits. */
export type CharacterGender = 'female' | 'male'

export interface CharacterSkill {
    id: string
    name: string
    value: number
    ability: AbilityKey | null
    proficiency: SkillProficiency
}

export interface CharacterAttack {
    id: string
    name: string
    attackBonus: string
    bonusSource: AttackBonusSource
    additionalBonus: number
    damage: string
    description: string
}

export interface CharacterSpell {
    id: string
    name: string
    level: number
    description: string
    /** Optional catalog metadata; legacy spell records may omit these fields. */
    school?: string
    classes?: string[]
    metadata?: Record<string, unknown>
}

export interface InventoryItem {
    id: string
    name: string
    quantity: number
    description: string
}

export interface CharacterMoney {
    copper: number
    silver: number
    electrum: number
    gold: number
    platinum: number
}

export interface CharacterBio {
    biography: string
    traits: string
    features: string
}

export interface CharacterDetails {
    class: string
    level: number
    experience: number
    armorClass: number
}

export type CharacterCollection = 'attacks' | 'spells' | 'cantrips' | 'inventory'

import type { CharacterProgression, RuleSourceRef, SpellProgressionType } from './rules.ts'

export type CharacterSchema = 3
export type CharacterKind = 'character' | 'npc'
export type CharacterCalculationMode = 'manual' | 'computed'
export type SkillProficiencySource = 'race' | 'class' | 'background' | 'manual' | 'feat'
export type CharacterAbilityBonusSource = 'species' | 'background' | 'manual' | 'feat' | 'class'
export type CharacterSpellLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface CharacterNpcBonus {
    id: string
    name: string
    value: number
}

export interface CharacterNpcEntry {
    id: string
    name: string
    description: string
    attackBonus: string
    damage: string
}

export interface CharacterNpc {
    name: string
    creatureType: string
    size: string
    alignment: string
    challengeRating: string
    proficiencyBonus: number
    armorClass: { mode: CharacterCalculationMode; value: number; additionalBonus: number }
    hitPoints: { max: number; current: number; temporary: number }
    speed: number
    initiative: { mode?: CharacterCalculationMode; additionalBonus: number; value?: number }
    senses: string
    languages: string
    abilities: CharacterAbilities
    skills: CharacterNpcBonus[]
    savingThrows: CharacterNpcBonus[]
    features: CharacterNpcEntry[]
    actions: CharacterNpcEntry[]
}

export interface CharacterEncounterParticipant {
    id: string
    sourceId?: string
    name: string
    maxHitPoints: number
    currentHitPoints: number
    armorClass: number
    initiative: number
    defeated: boolean
}

export interface CharacterEncounter {
    id: string
    name: string
    round: number
    currentParticipantId: string | null
    participants: CharacterEncounterParticipant[]
}

export interface RaceProfile {
    name: string
    subrace: string
    size: string
    speed: number
    abilityBonuses: Partial<Record<AbilityKey, number>>
    traits: string[]
    languages: string[]
}

export interface BackgroundProfile {
    name: string
    feature: string
    skillProficiencies: string[]
    toolProficiencies: string[]
    languages: string[]
    notes: string
}

/** 2024 origin data. Legacy race/background fields remain the compatibility view. */
export interface CharacterOrigin {
    species: string
    background: string
    /** Canonical catalog reference; originFeat remains a legacy display label. */
    featId?: string
    originFeat: string
    languages: string[]
    tools: string[]
}

export interface CharacterIdentity {
    name: string
    race: RaceProfile
    class: string
    subclass: string
    level: number
    experience: number
    background: BackgroundProfile
    alignment: string
}

export interface CharacterProficiency {
    toolProficiencies: string[]
    languageProficiencies: string[]
    /** Optional attribution for selected languages; does not apply any feat effects. */
    languageSources?: Record<string, RuleSourceRef[]>
}

export interface CharacterSavingThrow {
    proficient: boolean
}

export type CharacterSavingThrows = Record<AbilityKey, CharacterSavingThrow>

export interface CharacterArmorClass {
    mode: CharacterCalculationMode
    value: number
    armorBase: number | null
    armorDexCap: number | null
    shieldBonus: number
    additionalBonus: number
}

export interface CharacterCombat {
    armorClass: CharacterArmorClass
    initiative: { additionalBonus: number }
    speed: { base: number; fly: number | null; swim: number | null; override: number | null }
    hitPoints: { max: number; current: number; temporary: number }
    hitDice: { size: string; total: number; spent: number }
    deathSaves: { successes: number; failures: number }
}

export interface CharacterSkillRecord {
    id: string
    name: string
    value: number
    ability: AbilityKey | null
    proficiency: SkillProficiency
    calculationMode: CharacterCalculationMode
    additionalBonus: number
    proficiencySources?: SkillProficiencySource[]
}

export interface CharacterAttackRecord {
    id: string
    name: string
    kind: 'melee' | 'ranged' | 'spell' | 'other'
    abilitySource: AttackBonusSource
    proficient: boolean
    attackBonus: string
    calculationMode: CharacterCalculationMode
    additionalBonus: number
    damage: string
    damageType: string
    properties: string[]
    weaponMastery?: string
    /** Canonical catalog link; legacy free-text weaponMastery remains supported. */
    weaponId?: string
    masteryId?: string
    range: string
    description: string
}

export interface CharacterSpellRecord {
    id: string
    name: string
    level: number
    description: string
    school: string
    castingTime: string
    range: string
    components: string
    duration: string
    concentration: boolean
    ritual: boolean
    /** Optional catalog metadata; embedded legacy/custom spells remain valid without it. */
    classes?: string[]
    metadata?: Record<string, unknown>
}

export interface CharacterSpellSlot {
    max: number
    used: number
}

export type CharacterSpellSlots = Record<CharacterSpellLevel, CharacterSpellSlot>

export interface CharacterSpellcasting {
    /** Metadata only: full slot/level progression is intentionally out of scope. */
    spellProgressionType?: SpellProgressionType
    /** Canonical 2024 catalog references. Embedded knownSpells remain the compatibility view. */
    spellIds?: string[]
    cantripIds?: string[]
    knownSpells: CharacterSpellRecord[]
    preparedSpellIds: string[]
    cantrips: CharacterSpellRecord[]
    spellSlots: CharacterSpellSlots
}

export interface CharacterInventoryItemRecord {
    id: string
    name: string
    quantity: number
    weight: number | null
    description: string
    equipped: boolean
    properties: string[]
    /** Optional link to a canonical weapon definition. Existing items remain unlinked. */
    weaponId?: string
    /** Optional marker for items created by the character creation flow. */
    source?: 'creation' | 'user'
}

export interface CharacterInventory {
    items: CharacterInventoryItemRecord[]
    money: CharacterMoney
}

export interface CharacterPersonality {
    traits: string
    ideals: string
    bonds: string
    flaws: string
    biography: string
    features: string
}

/** User-authored character feats. These entries are descriptive only and never apply rules effects. */
export interface CharacterFeat {
    id: string
    name: string
    description: string
}

export interface CharacterCreation {
    /** Optional presentation choice; omitted by old records and treated as female. */
    gender?: CharacterGender
    speciesId?: string
    raceId: string
    classId: string
    /** Optional class foundation metadata; older records omit these safely. */
    classLevel?: number
    classSources?: RuleSourceRef[]
    spellProgressionType?: SpellProgressionType
    baseAbilityScores: CharacterAbilities
    raceSkillIds?: string[]
    raceAbilityChoices?: AbilityKey[]
    classSkillIds: string[]
    classSavingThrowKeys: AbilityKey[]
    manualSavingThrowKeys?: AbilityKey[]
    classFeatures: string[]
    raceFeatures: string[]
    classProficiencies: string[]
    raceLanguages?: string[]
    subraceId?: string
    subraceFeatures?: string[]
    subraceSkillIds?: string[]
    subraceLanguages?: string[]
    backgroundId?: string
    originFeatId?: string
    originAbilityChoices?: AbilityKey[]
    originAbilityFocus?: AbilityKey
    abilityBonusSources?: Partial<
        Record<AbilityKey, Array<{ source: CharacterAbilityBonusSource; amount: number }>>
    >
    /** Selected 2024 species choices; mechanics remain data-only until a rules layer handles them. */
    speciesChoices?: Record<string, string[]>
    backgroundSkillIds?: string[]
    backgroundToolProficiencies?: string[]
    backgroundLanguages?: string[]
    classEquipmentId?: string
    backgroundEquipmentId?: string
    startingEquipmentIds?: string[]
    startingGold?: number
}

export interface Character {
    id: string
    schemaVersion: CharacterSchema
    /** Optional discriminator; omitted legacy records are ordinary characters. */
    kind?: CharacterKind
    identity: CharacterIdentity
    abilities: CharacterAbilities
    proficiency: CharacterProficiency
    savingThrows: CharacterSavingThrows
    combat: CharacterCombat
    skills: CharacterSkillRecord[]
    attacks: CharacterAttackRecord[]
    spellcasting: CharacterSpellcasting
    inventory: CharacterInventory
    personality: CharacterPersonality
    origin: CharacterOrigin
    /** Optional user-authored feats; absent on older records and treated as an empty list. */
    feats?: CharacterFeat[]
    /** Canonical feature references; descriptions and levels resolve from the rules catalog. */
    features?: string[]
    /** Optional additive foundation; absent on older records and filled with safe defaults at runtime. */
    progression?: CharacterProgression
    extensions: Record<string, unknown>
    /** Optional NPC-specific data; character records do not need this field. */
    npc?: CharacterNpc
    /** Optional encounter planner state; absent on older records. */
    encounters?: CharacterEncounter[]
}

export function cloneCharacter(character: Character): Character {
    return JSON.parse(JSON.stringify(character)) as Character
}
