import type { AbilityKey, CharacterAttack, CharacterGender, CharacterSkill } from './character.ts'
import type {
    BackgroundProfile,
    CharacterCalculationMode,
    CharacterCombat,
    CharacterCreation,
    CharacterEncounter,
    CharacterFeat,
    CharacterInventory,
    CharacterKind,
    CharacterNpc,
    CharacterOrigin,
    CharacterPersonality,
    CharacterProficiency,
    CharacterSavingThrows,
    CharacterSpellcasting,
    RaceProfile,
    SkillProficiencySource,
} from './character.ts'
import type { CharacterProgression } from './rules.ts'

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

export interface CharacterSheetView {
    id: string
    schemaVersion: 3
    kind?: CharacterKind
    npc?: CharacterNpc
    encounters?: CharacterEncounter[]
    name: string
    class: string
    level: number
    experience: number
    armorClass: number
    abilities: CharacterSheetAbilities
    spells: CharacterSpellView[]
    cantrips: CharacterSpellView[]
    inventory: CharacterInventoryItemView[]
    money: CharacterMoneyView
    bio: CharacterBioView
    origin: CharacterOrigin
    skills: CharacterSkillView[]
    attacks: CharacterAttackView[]
    combat: CharacterCombat
    spellcasting: CharacterSpellcasting
    inventoryData: CharacterInventory
    personality: CharacterPersonality
    feats: CharacterFeat[]
    race: RaceProfile
    subclass: string
    background: BackgroundProfile
    alignment: string
    savingThrows: CharacterSavingThrows
    proficiency: CharacterProficiency
    features?: string[]
    progression?: CharacterProgression
    creation?: CharacterCreation
}

type CharacterSheetAbilities = import('./character.ts').CharacterAbilities
type CharacterSpellView = import('./character.ts').CharacterSpell
type CharacterInventoryItemView = import('./character.ts').InventoryItem
type CharacterMoneyView = import('./character.ts').CharacterMoney
type CharacterBioView = import('./character.ts').CharacterBio

export interface CharacterIdentityPatch {
    name?: string
    raceName?: string
    className?: string
    subclass?: string
    backgroundName?: string
    alignment?: string
    level?: number
    experience?: number
    gender?: CharacterGender
}

export type CharacterSkillPatch = Partial<
    Pick<
        CharacterSkillView,
        'value' | 'ability' | 'proficiency' | 'calculationMode' | 'additionalBonus'
    >
>
export type CharacterSavingThrowPatch = Partial<CharacterSheetView['savingThrows'][AbilityKey]>

export function cloneCharacterView(character: CharacterSheetView): CharacterSheetView {
    return JSON.parse(JSON.stringify(character)) as CharacterSheetView
}
