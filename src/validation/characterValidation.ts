import type { AbilityKey } from '../types/character.ts'
import type { Character } from '../types/character.ts'

export class InvalidCharacterError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'InvalidCharacterError'
    }
}

const ABILITY_KEYS: readonly AbilityKey[] = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
]

const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

const PROFICIENCY_VALUES = ['none', 'proficient', 'expertise'] as const

const CALCULATION_MODES = ['manual', 'computed'] as const

const ATTACK_KINDS = ['melee', 'ranged', 'spell', 'other'] as const

/** Checks that a value can be inspected as a plain record. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null

/** Checks that a value is a string. */
const isString = (value: unknown): value is string => typeof value === 'string'

/** Checks that a value is a finite number. */
const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

/** Checks that a value is an integer number. */
const isInteger = (value: unknown): value is number =>
    isFiniteNumber(value) && Number.isInteger(value)

/** Checks that a value names one of the six ability scores. */
const isAbilityKey = (value: unknown): value is AbilityKey =>
    typeof value === 'string' && ABILITY_KEYS.includes(value as AbilityKey)

/** Checks that a calculation mode is supported by the  sheet. */
const isCalculationMode = (value: unknown): boolean =>
    typeof value === 'string' &&
    CALCULATION_MODES.includes(value as (typeof CALCULATION_MODES)[number])

/** Checks that every member of a value is a string. */
const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(isString)

/** Validates the legacy race profile stored in a  character. */
function validRace(value: unknown): boolean {
    if (!isRecord(value)) return false
    const bonuses = value.abilityBonuses
    return (
        isString(value.name) &&
        isString(value.subrace) &&
        isString(value.size) &&
        isFiniteNumber(value.speed) &&
        isRecord(bonuses) &&
        Object.entries(bonuses).every(
            ([key, amount]) => isAbilityKey(key) && isFiniteNumber(amount),
        ) &&
        isStringArray(value.traits) &&
        isStringArray(value.languages)
    )
}

/** Validates the background profile stored in a  character. */
function validBackground(value: unknown): boolean {
    return (
        isRecord(value) &&
        isString(value.name) &&
        isString(value.feature) &&
        isStringArray(value.skillProficiencies) &&
        isStringArray(value.toolProficiencies) &&
        isStringArray(value.languages) &&
        isString(value.notes)
    )
}

/** Validates the character's origin fields. */
function validOrigin(value: unknown): boolean {
    return (
        isRecord(value) &&
        isString(value.species) &&
        isString(value.background) &&
        isString(value.originFeat) &&
        isStringArray(value.languages) &&
        isStringArray(value.tools)
    )
}

/** Validates the six ability score values. */
function validAbilities(value: unknown): boolean {
    return isRecord(value) && ABILITY_KEYS.every(key => isFiniteNumber(value[key]))
}

/** Validates a skill entry, including calculation and proficiency metadata. */
function validSkill(value: unknown): boolean {
    return (
        isRecord(value) &&
        isString(value.id) &&
        isString(value.name) &&
        isFiniteNumber(value.value) &&
        (value.ability === null || isAbilityKey(value.ability)) &&
        typeof value.proficiency === 'string' &&
        PROFICIENCY_VALUES.includes(value.proficiency as (typeof PROFICIENCY_VALUES)[number]) &&
        isCalculationMode(value.calculationMode) &&
        isInteger(value.additionalBonus)
    )
}

/** Validates an attack entry. */
function validAttack(value: unknown): boolean {
    return (
        isRecord(value) &&
        isString(value.id) &&
        isString(value.name) &&
        typeof value.kind === 'string' &&
        ATTACK_KINDS.includes(value.kind as (typeof ATTACK_KINDS)[number]) &&
        (value.ability === null || isAbilityKey(value.ability)) &&
        typeof value.proficient === 'boolean' &&
        isInteger(value.additionalBonus) &&
        isFiniteNumber(value.damage) &&
        value.damage >= 0 &&
        isString(value.damageType) &&
        isFiniteNumber(value.range) &&
        value.range >= 0 &&
        isString(value.description)
    )
}

/** Validates a spell object for either a cantrip or leveled spell list. */
function validSpell(value: unknown, cantrip: boolean): boolean {
    if (
        !isRecord(value) ||
        !isString(value.id) ||
        !isString(value.name) ||
        !isInteger(value.level) ||
        !isString(value.description)
    )
        return false
    if (cantrip ? value.level !== 0 : value.level < 1 || value.level > 9) return false
    return (
        isString(value.school) &&
        isString(value.castingTime) &&
        isString(value.range) &&
        isString(value.components) &&
        isString(value.duration) &&
        typeof value.concentration === 'boolean' &&
        typeof value.ritual === 'boolean'
    )
}

/** Validates the five non-negative coin balances. */
function validMoney(value: unknown): boolean {
    return (
        isRecord(value) &&
        ['copper', 'silver', 'electrum', 'gold', 'platinum'].every(
            key => isInteger(value[key]) && Number(value[key]) >= 0,
        )
    )
}

/** Validates saving throw proficiency flags. */
function validSavingThrows(value: unknown): boolean {
    if (!isRecord(value)) return false
    return ABILITY_KEYS.every(key => {
        const savingThrow = value[key]
        return isRecord(savingThrow) && typeof savingThrow.proficient === 'boolean'
    })
}

/** Validates spell lists, prepared spells, and spell slot counters. */
function validSpellcasting(value: unknown): boolean {
    if (
        !isRecord(value) ||
        !Array.isArray(value.knownSpells) ||
        !Array.isArray(value.cantrips) ||
        !isStringArray(value.preparedSpellIds) ||
        !isRecord(value.spellSlots)
    )
        return false
    if (
        !value.knownSpells.every(spell => validSpell(spell, false)) ||
        !value.cantrips.every(spell => validSpell(spell, true))
    )
        return false
    const knownIds = new Set(
        value.knownSpells.map(spell => (isRecord(spell) ? spell.id : null)),
    )
    if (!value.preparedSpellIds.every(id => knownIds.has(id))) return false
    const spellSlots = value.spellSlots
    return SPELL_LEVELS.every(level => {
        const slot = spellSlots[String(level)]
        return (
            isRecord(slot) &&
            isInteger(slot.max) &&
            Number(slot.max) >= 0 &&
            isInteger(slot.used) &&
            Number(slot.used) >= 0 &&
            Number(slot.used) <= Number(slot.max)
        )
    })
}

/** Validates inventory items and money. */
function validInventory(value: unknown): boolean {
    if (!isRecord(value) || !Array.isArray(value.items) || !validMoney(value.money)) return false
    return value.items.every(
        item =>
            isRecord(item) &&
            isString(item.id) &&
            isString(item.name) &&
            isInteger(item.quantity) &&
            Number(item.quantity) >= 0 &&
            (item.weight === null || isFiniteNumber(item.weight)) &&
            isString(item.description) &&
            typeof item.equipped === 'boolean' &&
            isStringArray(item.properties),
    )
}

function validEncounter(value: unknown): boolean {
    if (
        !isRecord(value) ||
        !isString(value.id) ||
        !value.id ||
        !isString(value.name) ||
        !isInteger(value.round) ||
        value.round < 1 ||
        (value.currentParticipantId !== null && !isString(value.currentParticipantId)) ||
        !Array.isArray(value.participants)
    )
        return false
    const ids = new Set<string>()
    return value.participants.every(participant => {
        if (
            !isRecord(participant) ||
            !isString(participant.id) ||
            !participant.id ||
            ids.has(participant.id) ||
            !isString(participant.name) ||
            !isInteger(participant.maxHitPoints) ||
            participant.maxHitPoints < 0 ||
            !isInteger(participant.currentHitPoints) ||
            participant.currentHitPoints < 0 ||
            participant.currentHitPoints > participant.maxHitPoints ||
            !isInteger(participant.armorClass) ||
            !isInteger(participant.initiative) ||
            typeof participant.defeated !== 'boolean'
        )
            return false
        ids.add(participant.id)
        return participant.sourceId === undefined || isString(participant.sourceId)
    })
}

/** Returns all validation messages for a  character payload. */
export function validateCharacter(value: unknown): string[] {
    if (!isRecord(value)) return ['Персонаж  должен быть объектом.']
    const errors: string[] = []

    const identity = value.identity
    if (value.schemaVersion !== 3) errors.push('Неподдерживаемая версия схемы персонажа.')
    if (!isString(value.id) || !value.id) errors.push('Не указан идентификатор персонажа.')
    if (value.kind !== undefined && value.kind !== 'character')
        errors.push('Неизвестный тип листа.')
    if (
        value.encounters !== undefined &&
        (!Array.isArray(value.encounters) || !value.encounters.every(validEncounter))
    )
        errors.push('Некорректные данные столкновений.')
    if (
        !isRecord(identity) ||
        !validRace(identity.race) ||
        !isString(identity.class) ||
        !isString(identity.subclass) ||
        !isInteger(identity.level) ||
        identity.level < 1 ||
        identity.level > 20 ||
        !isInteger(identity.experience) ||
        identity.experience < 0 ||
        !validBackground(identity.background) ||
        !isString(identity.alignment)
    )
        errors.push('Некорректная identity-секция.')
    if (!validAbilities(value.abilities)) errors.push('Некорректные характеристики.')
    if (
        !isRecord(value.proficiency) ||
        !isStringArray(value.proficiency.toolProficiencies) ||
        !isStringArray(value.proficiency.languageProficiencies)
    )
        errors.push('Некорректная proficiency-секция.')
    if (!validSavingThrows(value.savingThrows)) errors.push('Некорректные спасброски.')
    if (!Array.isArray(value.skills) || !value.skills.every(validSkill))
        errors.push('Некорректные навыки.')
    if (!Array.isArray(value.attacks) || !value.attacks.every(attack => validAttack(attack)))
        errors.push('Некорректные атаки.')
    if (!validSpellcasting(value.spellcasting)) errors.push('Некорректные данные магии.')
    if (!validInventory(value.inventory)) errors.push('Некорректный инвентарь.')
    if (
        value.feats !== undefined &&
        (!Array.isArray(value.feats) ||
            new Set(value.feats.map(feat => (isRecord(feat) ? feat.id : ''))).size !==
                value.feats.length ||
            !value.feats.every(
                feat =>
                    isRecord(feat) &&
                    isString(feat.id) &&
                    feat.id.length > 0 &&
                    isString(feat.name) &&
                    isString(feat.description),
            ))
    )
        errors.push('Некорректные черты персонажа.')
    const personality = value.personality
    if (
        !isRecord(personality) ||
        !['traits', 'ideals', 'bonds', 'flaws', 'biography', 'features'].every(key =>
            isString(personality[key]),
        )
    )
        errors.push('Некорректная personality-секция.')
    if (!isRecord(value.extensions)) errors.push('Некорректные extension-данные.')
    if (!validOrigin(value.origin)) errors.push('Некорректная origin-секция.')
    return errors
}

/** Throws a typed error when a  character payload is invalid. */
export function assertValidCharacter(value: unknown): asserts value is Character {
    const errors = validateCharacter(value)
    if (errors.length) throw new InvalidCharacterError(errors[0] ?? 'Некорректный персонаж .')
}
