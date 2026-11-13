import { defaultProgressionForCharacter } from '@/domain/characterProgressionData'
import { DEFAULT_SKILLS } from './characterFields.ts'
import type { Character } from '../types/character.ts'

const abilities = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
}

function createCharacter(): Character {
    const character: Character = {
        kind: 'character',
        identity: {
            name: 'Новый персонаж',
            race: {
                name: '',
                subrace: '',
                size: '',
                speed: 0,
                abilityBonuses: {},
                traits: [],
                languages: [],
            },
            class: '',
            subclass: '',
            level: 1,
            experience: 0,
            background: {
                name: '',
                feature: '',
                skillProficiencies: [],
                toolProficiencies: [],
                languages: [],
                notes: '',
            },
            alignment: '',
        },
        abilities: { ...abilities },
        proficiency: { toolProficiencies: [], languageProficiencies: [] },
        savingThrows: Object.fromEntries(
            Object.keys(abilities).map(key => [key, { proficient: false }]),
        ) as Character['savingThrows'],
        combat: {
            armorClass: {
                mode: 'manual',
                value: 10,
                armorBase: null,
                armorDexCap: null,
                shieldBonus: 0,
                additionalBonus: 0,
            },
            initiative: { additionalBonus: 0 },
            speed: { base: 0, fly: null, swim: null, override: null },
            hitPoints: { max: 0, current: 0, temporary: 0 },
            hitDice: { size: '', total: 0, spent: 0 },
            deathSaves: { successes: 0, failures: 0 },
        },
        skills: DEFAULT_SKILLS.map(skill => ({ ...skill })),
        attacks: [],
        spellcasting: {
            spellIds: [],
            cantripIds: [],
            knownSpells: [],
            preparedSpellIds: [],
            cantrips: [],
            spellSlots: {
                1: { max: 0, used: 0 },
                2: { max: 0, used: 0 },
                3: { max: 0, used: 0 },
                4: { max: 0, used: 0 },
                5: { max: 0, used: 0 },
                6: { max: 0, used: 0 },
                7: { max: 0, used: 0 },
                8: { max: 0, used: 0 },
                9: { max: 0, used: 0 },
            },
        },
        inventory: {
            items: [],
            money: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
        },
        personality: {
            biography: '',
            traits: '',
            ideals: '',
            bonds: '',
            flaws: '',
            features: '',
        },
        origin: { species: '', background: '', originFeat: '', languages: [], tools: [] },
        feats: [],
        features: [],
        extensions: {},
    }
    character.progression = defaultProgressionForCharacter(character)
    return character
}

export function createMockCharacter(): Character {
    return createCharacter()
}

export function createEmptyCharacter(): Character {
    return createCharacter()
}
