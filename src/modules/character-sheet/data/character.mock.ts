import { defaultProgressionForCharacter } from '../domain/characterProgression.ts'
import { DEFAULT_SKILLS } from './characterFields.ts'
import type { CharacterSkillRecord, CharacterSpellRecord, Character } from '../types/character.ts'

const abilities = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
}

function skillRecords(): CharacterSkillRecord[] {
    return DEFAULT_SKILLS.map(skill => ({
        ...skill,
        calculationMode: 'computed' as const,
        additionalBonus: 0,
    }))
}

function spell(id: string, name: string, level: number, description: string): CharacterSpellRecord {
    return {
        id,
        name,
        level,
        description,
        school: '',
        castingTime: '',
        range: '',
        components: '',
        duration: '',
        concentration: false,
        ritual: false,
    }
}

function createCharacter(id: string, demo: boolean): Character {
    const character: Character = {
        id,
        schemaVersion: 3,
        kind: 'character',
        ruleset: '2014',
        identity: {
            name: demo ? 'Элара Лунный Свет' : 'Новый персонаж',
            race: {
                name: '',
                subrace: '',
                size: '',
                speed: 0,
                abilityBonuses: {},
                traits: [],
                languages: [],
            },
            class: demo ? 'Волшебник' : '',
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
        abilities: demo
            ? {
                  strength: 10,
                  dexterity: 14,
                  constitution: 12,
                  intelligence: 16,
                  wisdom: 13,
                  charisma: 15,
              }
            : { ...abilities },
        proficiency: { toolProficiencies: [], languageProficiencies: [] },
        savingThrows: Object.fromEntries(
            Object.keys(abilities).map(key => [key, { proficient: false, additionalBonus: 0 }]),
        ) as Character['savingThrows'],
        combat: {
            armorClass: {
                mode: 'manual',
                value: demo ? 12 : 10,
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
        skills: skillRecords(),
        attacks: demo
            ? [
                  {
                      id: 'attack-1',
                      name: 'Посох',
                      kind: 'other',
                      abilitySource: 'manual',
                      proficient: false,
                      attackBonus: '+4',
                      calculationMode: 'manual',
                      additionalBonus: 0,
                      damage: '1к6 + 2',
                      damageType: '',
                      properties: [],
                      weaponMastery: '',
                      range: '',
                      description: 'Обычная атака посохом.',
                  },
              ]
            : [],
        spellcasting: {
            spellRuleset: '2014',
            spellcastingAbility: null,
            spellIds: [],
            cantripIds: [],
            knownSpells: demo
                ? [spell('spell-1', 'Щит', 1, 'Защитная реакция, повышающая класс брони.')]
                : [],
            preparedSpellIds: [],
            cantrips: demo ? [spell('cantrip-1', 'Свет', 0, 'Создаёт яркий свет на предмете.')] : [],
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
            items: demo
                ? [
                      {
                          id: 'item-1',
                          name: 'Фокусировка волшебника',
                          quantity: 1,
                          weight: null,
                          description: 'Деревянный жезл.',
                          equipped: false,
                          properties: [],
                          source: 'creation',
                      },
                  ]
                : [],
            money: demo
                ? { copper: 0, silver: 12, electrum: 0, gold: 37, platinum: 0 }
                : { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
        },
        personality: {
            biography: demo ? 'Ученица академии, ищущая забытые руины.' : '',
            traits: demo ? 'Любит задавать вопросы.' : '',
            ideals: '',
            bonds: '',
            flaws: '',
            features: demo ? 'Тёмное зрение; владение простым оружием.' : '',
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
    return createCharacter('demo-character', true)
}

export function createEmptyCharacter(id = 'demo-character'): Character {
    return createCharacter(id, false)
}
