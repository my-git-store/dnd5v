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

export interface Character {
    /** Optional marker retained for compatibility with stored characters. */
    kind?: 'character'
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
    extensions: Record<string, unknown>
}
