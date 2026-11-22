export type AbilityKey =
    'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

export type CharacterAbilities = Record<AbilityKey, number>
export type SkillProficiency = 'none' | 'proficient' | 'expertise'

export interface CharacterMoney {
    copper: number
    silver: number
    electrum: number
    gold: number
    platinum: number
}

export type CharacterCalculationMode = 'manual' | 'computed'
export type CharacterSpellLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface RaceProfile {
    name: string
    subrace: string
    size: string
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

export interface CharacterOrigin {
    species: string
    background: string
    originFeat: string
    languages: string[]
    tools: string[]
}

export interface CharacterIdentity {
    /** Optional display name retained when reading older v3 records. */
    name?: string
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
    speed: number
    hitPoints: { max: number; current: number; temporary: number }
    hitDice: { size: string; total: number; spent: number }
    deathSaves: { successes: number; failures: number }
}

export interface CharacterSkillRecord {
    name: string
    value: number
    ability: AbilityKey | null
    proficiency: SkillProficiency
    calculationMode: CharacterCalculationMode
    additionalBonus: number
}

export interface CharacterAttackDamageRecord {
    damage: string
    damageType: string
    additionalDamage: number
    ability: AbilityKey | null
    proficient: boolean
}

export interface CharacterAttackRecord {
    name: string
    kind: 'melee' | 'ranged' | 'spell' | 'other'
    damages: CharacterAttackDamageRecord[]
    range: number
    description: string
}

export interface CharacterSpellRecord {
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
}

export interface CharacterKnownSpellRecord extends CharacterSpellRecord {
    prepared: boolean
}

export interface CharacterSpellSlot {
    max: number
    used: number
}

export type CharacterSpellSlots = Record<CharacterSpellLevel, CharacterSpellSlot>

export interface CharacterSpellcasting {
    knownSpells: CharacterKnownSpellRecord[]
    cantrips: CharacterSpellRecord[]
    spellSlots: CharacterSpellSlots
}

export interface CharacterInventoryItemRecord {
    name: string
    quantity: number
    weight: number | null
    description: string
    equipped: boolean
    properties: string
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
    name: string
    description: string
}

export type CharacterKind = 'character' | 'npc'
export type CharacterRuleset = '2014' | '2024'

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

export interface Character {
    /** Compatibility identity fields used by the collection adapter. */
    id?: string
    schemaVersion?: 3
    ruleset?: CharacterRuleset
    /** Optional marker retained for compatibility with stored characters. */
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
    /** Optional NPC profile retained in current character records for compatibility. */
    npc?: CharacterNpc
    /** Optional saved encounter planner state; absent on older records. */
    encounters?: CharacterEncounter[]
    kind?: CharacterKind
    extensions: Record<string, unknown>
}
