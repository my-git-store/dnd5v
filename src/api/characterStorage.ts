import type { Character } from '@/types/character'

export const CHARACTER_STORAGE_KEY = 'nastolka:character-sheet'
export const LEGACY_CHARACTER_STORAGE_PREFIX = 'nastolka:character-sheet:legacy:'

const ABILITY_KEYS = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
] as const

export interface CharacterStorageLike {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem?(key: string): void
    readonly length?: number
    key?(index: number): string | null
}

type RecordValue = Record<string, unknown>

function isRecord(value: unknown): value is RecordValue {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
    return typeof value === 'string'
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(isString)
}

function isAbilityKey(value: unknown): boolean {
    return typeof value === 'string' && (ABILITY_KEYS as readonly string[]).includes(value)
}

function hasAbilityScores(value: unknown): boolean {
    return isRecord(value) && ABILITY_KEYS.every(key => isFiniteNumber(value[key]))
}

function isEncounterList(value: unknown): boolean {
    if (!Array.isArray(value)) return false
    const encounterIds = new Set<string>()
    return value.every(encounter => {
        if (!isRecord(encounter)) return false
        if (
            !isString(encounter.id) ||
            !isString(encounter.name) ||
            typeof encounter.round !== 'number' ||
            !Number.isInteger(encounter.round) ||
            encounter.round < 1 ||
            !(encounter.currentParticipantId === null || isString(encounter.currentParticipantId)) ||
            !Array.isArray(encounter.participants) ||
            encounterIds.has(encounter.id)
        )
            return false
        encounterIds.add(encounter.id)

        const ids = new Set<string>()
        const hasValidParticipants = encounter.participants.every(participant => {
            if (
                !isRecord(participant) ||
                !isString(participant.id) ||
                !isString(participant.name) ||
                !isFiniteNumber(participant.maxHitPoints) ||
                participant.maxHitPoints < 0 ||
                !isFiniteNumber(participant.currentHitPoints) ||
                participant.currentHitPoints < 0 ||
                participant.currentHitPoints > participant.maxHitPoints ||
                !isFiniteNumber(participant.armorClass) ||
                !isFiniteNumber(participant.initiative) ||
                typeof participant.defeated !== 'boolean' ||
                (participant.sourceId !== undefined && !isString(participant.sourceId)) ||
                ids.has(participant.id)
            )
                return false
            ids.add(participant.id)
            return true
        })
        return (
            hasValidParticipants &&
            (encounter.currentParticipantId === null ||
                encounter.participants.some(
                    participant =>
                        isRecord(participant) && participant.id === encounter.currentParticipantId,
                ))
        )
    })
}

function isNpcBonusList(value: unknown): boolean {
    return (
        Array.isArray(value) &&
        value.every(
            entry =>
                isRecord(entry) &&
                isString(entry.id) &&
                isString(entry.name) &&
                isFiniteNumber(entry.value),
        )
    )
}

function isNpcEntryList(value: unknown): boolean {
    return (
        Array.isArray(value) &&
        value.every(
            entry =>
                isRecord(entry) &&
                isString(entry.id) &&
                isString(entry.name) &&
                isString(entry.description) &&
                isString(entry.attackBonus) &&
                isString(entry.damage),
        )
    )
}

function isNpcProfile(value: unknown): boolean {
    if (!isRecord(value)) return false
    const armorClass = value.armorClass
    const hitPoints = value.hitPoints
    const initiative = value.initiative
    return (
        isString(value.name) &&
        isString(value.creatureType) &&
        isString(value.size) &&
        isString(value.alignment) &&
        isString(value.challengeRating) &&
        isFiniteNumber(value.proficiencyBonus) &&
        value.proficiencyBonus >= 0 &&
        isRecord(armorClass) &&
        ['manual', 'computed'].includes(String(armorClass.mode)) &&
        isFiniteNumber(armorClass.value) &&
        isFiniteNumber(armorClass.additionalBonus) &&
        isRecord(hitPoints) &&
        isFiniteNumber(hitPoints.max) &&
        hitPoints.max >= 0 &&
        isFiniteNumber(hitPoints.current) &&
        hitPoints.current >= 0 &&
        hitPoints.current <= hitPoints.max &&
        isFiniteNumber(hitPoints.temporary) &&
        hitPoints.temporary >= 0 &&
        isFiniteNumber(value.speed) &&
        value.speed >= 0 &&
        isRecord(initiative) &&
        (initiative.mode === undefined || ['manual', 'computed'].includes(String(initiative.mode))) &&
        isFiniteNumber(initiative.additionalBonus) &&
        (initiative.value === undefined || isFiniteNumber(initiative.value)) &&
        isString(value.senses) &&
        isString(value.languages) &&
        hasAbilityScores(value.abilities) &&
        isNpcBonusList(value.skills) &&
        isNpcBonusList(value.savingThrows) &&
        isNpcEntryList(value.features) &&
        isNpcEntryList(value.actions)
    )
}

function isCharacterPayload(value: unknown): value is Character {
    if (
        !isRecord(value) ||
        value.kind === 'npc' ||
        (value.kind !== undefined && value.kind !== 'character')
    )
        return false

    const identity = value.identity
    const abilities = value.abilities
    const proficiency = value.proficiency
    const savingThrows = value.savingThrows
    const combat = value.combat
    const spellcasting = value.spellcasting
    const inventory = value.inventory
    const personality = value.personality
    const origin = value.origin

    if (!isRecord(identity) || !isRecord(identity.race) || !isRecord(identity.background))
        return false
    if (identity.name !== undefined && !isString(identity.name)) return false
    if (
        !isString(identity.race.name) ||
        !isString(identity.race.subrace) ||
        !isString(identity.race.size)
    )
        return false
    if (
        !isRecord(identity.race.abilityBonuses) ||
        !Object.values(identity.race.abilityBonuses).every(isFiniteNumber) ||
        !isStringArray(identity.race.traits) ||
        !isStringArray(identity.race.languages)
    )
        return false
    if (
        !isString(identity.class) ||
        !isString(identity.subclass) ||
        !isFiniteNumber(identity.level) ||
        !isFiniteNumber(identity.experience)
    )
        return false
    if (value.id !== undefined && (!isString(value.id) || !value.id.trim())) return false
    if (value.schemaVersion !== undefined && value.schemaVersion !== 3) return false
    if (value.ruleset !== undefined && !['2014', '2024'].includes(String(value.ruleset)))
        return false
    if (
        !isString(identity.background.name) ||
        !isString(identity.background.feature) ||
        !isString(identity.background.notes)
    )
        return false
    if (
        !isStringArray(identity.background.skillProficiencies) ||
        !isStringArray(identity.background.toolProficiencies) ||
        !isStringArray(identity.background.languages)
    )
        return false
    if (!isString(identity.alignment) || !hasAbilityScores(abilities)) return false

    if (
        !isRecord(proficiency) ||
        !isStringArray(proficiency.toolProficiencies) ||
        !isStringArray(proficiency.languageProficiencies)
    )
        return false
    if (
        !isRecord(savingThrows) ||
        !ABILITY_KEYS.every(
            key => isRecord(savingThrows[key]) && typeof savingThrows[key].proficient === 'boolean',
        )
    )
        return false

    if (!isRecord(combat) || !isRecord(combat.armorClass) || !isRecord(combat.initiative))
        return false
    if (
        !['manual', 'computed'].includes(String(combat.armorClass.mode)) ||
        !isFiniteNumber(combat.armorClass.value)
    )
        return false
    if (
        !(combat.armorClass.armorBase === null || isFiniteNumber(combat.armorClass.armorBase)) ||
        !(combat.armorClass.armorDexCap === null || isFiniteNumber(combat.armorClass.armorDexCap))
    )
        return false
    if (
        !isFiniteNumber(combat.armorClass.shieldBonus) ||
        !isFiniteNumber(combat.armorClass.additionalBonus) ||
        !isFiniteNumber(combat.initiative.additionalBonus)
    )
        return false
    const hitPoints = combat.hitPoints
    if (
        !isFiniteNumber(combat.speed) ||
        !isRecord(hitPoints) ||
        !['current', 'max', 'temporary'].every(key => isFiniteNumber(hitPoints[key]))
    )
        return false
    if (
        !isRecord(combat.hitDice) ||
        !isString(combat.hitDice.size) ||
        !isFiniteNumber(combat.hitDice.total) ||
        !isFiniteNumber(combat.hitDice.spent)
    )
        return false
    if (
        !isRecord(combat.deathSaves) ||
        !isFiniteNumber(combat.deathSaves.successes) ||
        !isFiniteNumber(combat.deathSaves.failures)
    )
        return false

    if (
        !Array.isArray(value.skills) ||
        !value.skills.every(
            skill =>
                isRecord(skill) &&
                isString(skill.name) &&
                isFiniteNumber(skill.value) &&
                (skill.ability === null || isAbilityKey(skill.ability)) &&
                ['none', 'proficient', 'expertise'].includes(String(skill.proficiency)) &&
                ['manual', 'computed'].includes(String(skill.calculationMode)) &&
                isFiniteNumber(skill.additionalBonus),
        )
    )
        return false
    if (
        !Array.isArray(value.attacks) ||
        !value.attacks.every(
            attack =>
                isRecord(attack) &&
                isString(attack.name) &&
                ['melee', 'ranged', 'spell', 'other'].includes(String(attack.kind)) &&
                isFiniteNumber(attack.range) &&
                isString(attack.description) &&
                Array.isArray(attack.damages) &&
                attack.damages.every(
                    damage =>
                        isRecord(damage) &&
                        isString(damage.damage) &&
                        isString(damage.damageType) &&
                        isFiniteNumber(damage.additionalDamage) &&
                        (damage.ability === null || isAbilityKey(damage.ability)) &&
                        typeof damage.proficient === 'boolean',
                ),
        )
    )
        return false
    if (
        !isRecord(spellcasting) ||
        !Array.isArray(spellcasting.knownSpells) ||
        !Array.isArray(spellcasting.cantrips) ||
        !isRecord(spellcasting.spellSlots)
    )
        return false
    const isSpell = (spell: unknown) =>
        isRecord(spell) &&
        isString(spell.name) &&
        isFiniteNumber(spell.level) &&
        isString(spell.description) &&
        isString(spell.school) &&
        isString(spell.castingTime) &&
        isString(spell.range) &&
        isString(spell.components) &&
        isString(spell.duration) &&
        typeof spell.concentration === 'boolean' &&
        typeof spell.ritual === 'boolean'
    if (
        !spellcasting.knownSpells.every(
            spell => isSpell(spell) && isRecord(spell) && typeof spell.prepared === 'boolean',
        )
    )
        return false
    if (!spellcasting.cantrips.every(isSpell)) return false
    const spellSlots = spellcasting.spellSlots
    if (
        !Array.from({ length: 9 }, (_, index) => String(index + 1)).every(level => {
            const slot = spellSlots[level]
            return isRecord(slot) && isFiniteNumber(slot.max) && isFiniteNumber(slot.used)
        })
    )
        return false
    if (!isRecord(inventory) || !Array.isArray(inventory.items) || !isRecord(inventory.money))
        return false
    if (
        !inventory.items.every(
            item =>
                isRecord(item) &&
                isString(item.name) &&
                isFiniteNumber(item.quantity) &&
                (item.weight === null || isFiniteNumber(item.weight)) &&
                isString(item.description) &&
                typeof item.equipped === 'boolean' &&
                isString(item.properties),
        )
    )
        return false
    const money = inventory.money
    if (
        !['copper', 'silver', 'electrum', 'gold', 'platinum'].every(coin =>
            isFiniteNumber(money[coin]),
        )
    )
        return false
    if (
        !isRecord(personality) ||
        !['traits', 'ideals', 'bonds', 'flaws', 'biography', 'features'].every(key =>
            isString(personality[key]),
        )
    )
        return false
    if (
        !isRecord(origin) ||
        !['species', 'background', 'originFeat'].every(key => isString(origin[key]))
    )
        return false
    if (
        !isStringArray(origin.languages) ||
        !isStringArray(origin.tools) ||
        !isRecord(value.extensions)
    )
        return false
    if (
        value.feats !== undefined &&
        (!Array.isArray(value.feats) ||
            !value.feats.every(
                feat => isRecord(feat) && isString(feat.name) && isString(feat.description),
            ))
    )
        return false
    if (value.encounters !== undefined && !isEncounterList(value.encounters)) return false
    if (value.npc !== undefined && !isNpcProfile(value.npc)) return false

    return true
}

/** Validates the currently editable character payload without reading browser storage. */
export function isCurrentCharacterPayload(value: unknown): value is Character {
    return isCharacterPayload(value)
}

function preserveRawRecord(raw: string, storage: CharacterStorageLike): void {
    let index = 1
    let key = `${LEGACY_CHARACTER_STORAGE_PREFIX}${index}`
    while (storage.getItem(key) !== null) {
        index += 1
        key = `${LEGACY_CHARACTER_STORAGE_PREFIX}${index}`
    }
    storage.setItem(key, raw)
}

function normalizeStoredCharacter(value: unknown): unknown {
    if (!isRecord(value) || value.kind === 'npc') return value

    const normalized: unknown = JSON.parse(JSON.stringify(value))
    if (!isRecord(normalized)) return normalized
    if (!isRecord(normalized.extensions)) normalized.extensions = {}
    if (normalized.feats === undefined) normalized.feats = []

    if (Array.isArray(normalized.attacks)) {
        normalized.attacks = normalized.attacks.map(attackValue => {
            if (!isRecord(attackValue)) return attackValue
            const attack = { ...attackValue }
            const rawDamages = Array.isArray(attack.damages)
                ? attack.damages
                : typeof attack.damage === 'string'
                  ? [{ damage: attack.damage }]
                  : isFiniteNumber(attack.damage) && attack.damage >= 0
                    ? [{ damage: String(attack.damage) }]
                    : []

            attack.damages = rawDamages.map(damageValue => {
                if (!isRecord(damageValue)) return damageValue
                return {
                    ...damageValue,
                    damage: isString(damageValue.damage)
                        ? damageValue.damage
                        : isFiniteNumber(damageValue.damage) && damageValue.damage >= 0
                          ? String(damageValue.damage)
                          : '',
                    damageType: isString(damageValue.damageType)
                        ? damageValue.damageType
                        : isString(attack.damageType)
                          ? attack.damageType
                          : '',
                    additionalDamage: isFiniteNumber(damageValue.additionalDamage)
                        ? damageValue.additionalDamage
                        : isFiniteNumber(attack.additionalBonus)
                          ? attack.additionalBonus
                          : 0,
                    ability: isAbilityKey(damageValue.ability)
                        ? damageValue.ability
                        : isAbilityKey(attack.ability)
                          ? attack.ability
                          : null,
                    proficient:
                        typeof damageValue.proficient === 'boolean'
                            ? damageValue.proficient
                            : typeof attack.proficient === 'boolean'
                              ? attack.proficient
                              : false,
                }
            })
            delete attack.damage
            delete attack.damageType
            delete attack.additionalBonus
            delete attack.ability
            delete attack.proficient
            return attack
        })
    }

    if (isRecord(normalized.inventory) && Array.isArray(normalized.inventory.items)) {
        normalized.inventory.items = normalized.inventory.items.map(itemValue => {
            if (!isRecord(itemValue) || !Array.isArray(itemValue.properties)) return itemValue
            return { ...itemValue, properties: itemValue.properties.filter(isString).join(', ') }
        })
    }

    return normalized
}

/** Reports whether the active key contains a record this version cannot safely edit. */
export function hasIncompatibleStoredCharacter(storage?: CharacterStorageLike): boolean {
    try {
        const target = storage ?? browserStorage()
        const raw = target.getItem(CHARACTER_STORAGE_KEY)
        if (raw !== null) {
            try {
                if (!isCharacterPayload(JSON.parse(raw) as unknown)) return true
            } catch {
                return true
            }
        }

        if (typeof target.length !== 'number' || !target.key) return false
        for (let index = 0; index < target.length; index += 1) {
            const key = target.key(index)
            if (
                key &&
                (key.startsWith('nastolka:character-sheet:v1:') ||
                    key.startsWith('nastolka:character-sheet:v2:') ||
                    key.startsWith('nastolka:character-sheet:v3:') ||
                    (key.startsWith('nastolka:character-sheet:') &&
                        !key.startsWith('nastolka:character-sheet:legacy:') &&
                        key !== 'nastolka:character-sheet:index' &&
                        key !== 'nastolka:character-sheet:active') ||
                    key === 'nastolka:character-sheet:index' ||
                    key === 'nastolka:character-sheet:active' ||
                    key === 'nastolka:monster-sheet')
            )
                return true
        }
        return false
    } catch {
        return false
    }
}

export class CharacterStorageError extends Error {
    cause?: unknown

    constructor(message: string, options?: { cause?: unknown }) {
        super(message)
        this.cause = options?.cause
        this.name = 'CharacterStorageError'
    }
}

function browserStorage(): CharacterStorageLike {
    if (typeof window === 'undefined')
        throw new CharacterStorageError('Локальное хранилище недоступно вне браузера.')
    return window.localStorage
}

export function readStoredCharacter(storage?: CharacterStorageLike) {
    const target = storage ?? browserStorage()
    const raw = target.getItem(CHARACTER_STORAGE_KEY)
    if (raw === null) return null

    try {
        const previousValue: unknown = JSON.parse(raw)
        const value = normalizeStoredCharacter(previousValue)
        if (!isCharacterPayload(value)) return null
        if (JSON.stringify(value) !== JSON.stringify(previousValue)) {
            preserveRawRecord(raw, target)
            target.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(value))
        }
        return value
    } catch {
        return null
    }
}

export function writeStoredCharacter(
    character: Character,
    storage?: CharacterStorageLike,
    preservePrevious = false,
): void {
    try {
        if (!isCharacterPayload(character)) {
            throw new CharacterStorageError(
                'Данные персонажа не прошли проверку. Сохранение не выполнено.',
            )
        }
        const target = storage ?? browserStorage()
        const previous = target.getItem(CHARACTER_STORAGE_KEY)
        if (previous !== null) {
            let previousValue: unknown
            try {
                previousValue = JSON.parse(previous) as unknown
            } catch {
                previousValue = null
            }
            if (preservePrevious || !isCharacterPayload(previousValue))
                preserveRawRecord(previous, target)
        }
        target.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(character))
    } catch (error) {
        throw new CharacterStorageError('Не удалось сохранить персонажа.', { cause: error })
    }
}
