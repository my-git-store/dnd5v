import {
    isCurrentCharacterPayload,
    type CharacterStorageLike,
} from './characterStorage.ts'
import { createEmptyCharacter } from '../data/character.mock.ts'
import type {
    AbilityKey,
    Character,
    CharacterKind,
    CharacterNpc,
    CharacterRuleset,
} from '../types/character.ts'

/** New writes use a separate namespace; historical keys remain intact as recovery sources. */
export const CHARACTER_COLLECTION_PREFIX = 'nastolka:characters:v1:'
export const CHARACTER_COLLECTION_INDEX_KEY = `${CHARACTER_COLLECTION_PREFIX}index`
export const CHARACTER_COLLECTION_ACTIVE_KEY = `${CHARACTER_COLLECTION_PREFIX}active`
export const NPC_COLLECTION_PREFIX = 'nastolka:npcs:v1:'
export const NPC_COLLECTION_INDEX_KEY = `${NPC_COLLECTION_PREFIX}index`
export const NPC_COLLECTION_ACTIVE_KEY = `${NPC_COLLECTION_PREFIX}active`
export const HISTORICAL_CHARACTER_PREFIX = 'nastolka:character-sheet:'
export const HISTORICAL_CHARACTER_INDEX_KEY = `${HISTORICAL_CHARACTER_PREFIX}index`
export const HISTORICAL_CHARACTER_ACTIVE_KEY = `${HISTORICAL_CHARACTER_PREFIX}active`
export const LEGACY_MONSTER_KEY = 'nastolka:monster-sheet'

const COMPATIBILITY_EXTENSION = '__nastolkaStorageCompatibility'
const CHARACTER_TOMBSTONE_PREFIX = `${CHARACTER_COLLECTION_PREFIX}deleted:`
const NPC_TOMBSTONE_PREFIX = `${NPC_COLLECTION_PREFIX}deleted:`
const ABILITY_KEYS: AbilityKey[] = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
]

type DataRecord = Record<string, unknown>
export type CollectionKind = Extract<CharacterKind, 'character' | 'npc'>

export interface CompatibleRecord {
    id: string
    kind: CollectionKind
    character: Character
    sourceKey: string
    format: 'current' | 'historical-v1' | 'historical-v2' | 'historical-v3' | 'legacy-single' | 'legacy-monster'
    sourceRecord?: unknown
}
export interface StorageIssue {
    key: string
    message: string
}

export interface CollectionReadResult {
    characters: CompatibleRecord[]
    npcs: CompatibleRecord[]
    issues: StorageIssue[]
}

interface StoredEnvelope {
    adapterVersion: 1
    id: string
    kind: CollectionKind
    character: Character
    sourceKey?: string
    sourceRecord?: unknown
}

function isRecord(value: unknown): value is DataRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function finite(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function string(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function recordAt(value: unknown, key: string): DataRecord | null {
    return isRecord(value) && isRecord(value[key]) ? value[key] : null
}

function validId(value: unknown): value is string {
    return typeof value === 'string' && /^[\p{L}\p{N}_.:-]{1,160}$/u.test(value)
}

function makeId(prefix: string): string {
    const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    return `${prefix}-${random}`
}

function compatibilityOf(character: Character): DataRecord | null {
    const compatibility = character.extensions[COMPATIBILITY_EXTENSION]
    return isRecord(compatibility) ? compatibility : null
}

function readRuleset(value: DataRecord): CharacterRuleset {
    const spellcasting = recordAt(value, 'spellcasting')
    const creation = recordAt(recordAt(value, 'extensions'), 'characterCreation')
    const candidate = value.ruleset ?? spellcasting?.spellRuleset ?? creation?.ruleset
    return candidate === '2014' ? '2014' : '2024'
}

function numericMap(value: unknown): Partial<Record<AbilityKey, number>> {
    const result: Partial<Record<AbilityKey, number>> = {}
    if (!isRecord(value)) return result
    for (const key of ABILITY_KEYS) {
        if (typeof value[key] === 'number' && Number.isFinite(value[key])) result[key] = value[key]
    }
    return result
}

function npcProfile(value: unknown): CharacterNpc | null {
    if (!isRecord(value)) return null
    const armor = recordAt(value, 'armorClass')
    const hitPoints = recordAt(value, 'hitPoints')
    const initiative = recordAt(value, 'initiative')
    const abilities = numericMap(value.abilities)
    if (ABILITY_KEYS.some(key => abilities[key] === undefined)) return null
    const normalizeBonusList = (entries: unknown) => {
        if (!Array.isArray(entries)) return []
        return entries.flatMap((entry, index) => {
            if (!isRecord(entry) || typeof entry.name !== 'string') return []
            return [{ id: string(entry.id, `npc-bonus-${index + 1}`), name: entry.name, value: finite(entry.value, 0) }]
        })
    }
    const normalizeEntries = (entries: unknown) => {
        if (!Array.isArray(entries)) return []
        return entries.flatMap((entry, index) => {
            if (!isRecord(entry) || typeof entry.name !== 'string') return []
            return [{
                id: string(entry.id, `npc-entry-${index + 1}`),
                name: entry.name,
                description: string(entry.description),
                attackBonus: string(entry.attackBonus),
                damage: string(entry.damage),
            }]
        })
    }
    const maxHp = finite(hitPoints?.max, 0)
    const currentHp = Math.min(maxHp, Math.max(0, finite(hitPoints?.current, maxHp)))
    return {
        name: string(value.name),
        creatureType: string(value.creatureType),
        size: string(value.size),
        alignment: string(value.alignment),
        challengeRating: string(value.challengeRating),
        proficiencyBonus: Math.max(0, finite(value.proficiencyBonus, 2)),
        armorClass: {
            mode: armor?.mode === 'computed' ? 'computed' : 'manual',
            value: finite(armor?.value, finite(value.armorClass, 10)),
            additionalBonus: finite(armor?.additionalBonus, 0),
        },
        hitPoints: { max: maxHp, current: currentHp, temporary: Math.max(0, finite(hitPoints?.temporary, 0)) },
        speed: Math.max(0, finite(value.speed, 0)),
        initiative: {
            mode: initiative?.mode === 'manual' ? 'manual' : 'computed',
            additionalBonus: finite(initiative?.additionalBonus, 0),
            value: finite(initiative?.value, 0),
        },
        senses: string(value.senses),
        languages: string(value.languages),
        abilities: Object.fromEntries(ABILITY_KEYS.map(key => [key, abilities[key] ?? 10])) as Character['abilities'],
        skills: normalizeBonusList(value.skills),
        savingThrows: normalizeBonusList(value.savingThrows),
        features: normalizeEntries(value.features),
        actions: normalizeEntries(value.actions),
    }
}

function preserveCompatibility(character: Character, source: DataRecord, sourceKey: string, sourceFormat: CompatibleRecord['format']): Character {
    const next = clone(character)
    next.extensions = { ...next.extensions }
    next.extensions[COMPATIBILITY_EXTENSION] = {
        sourceKey,
        sourceFormat,
        sourceId: validId(source.id) ? source.id : undefined,
        sourceSchemaVersion: source.schemaVersion,
    }
    return next
}

/**
 * Projects historical v1/v2/v3 records into the current editor model. The untouched source is
 * never rewritten; metadata points back to it so export can include the complete old record.
 */
export function adaptHistoricalCharacter(
    value: unknown,
    sourceKey: string,
    forcedId?: string,
    formatHint?: CompatibleRecord['format'],
): Character | null {
    if (!isRecord(value)) return null
    const version = value.schemaVersion
    if (version !== undefined && ![1, 2, 3].includes(Number(version))) return null
    const format: CompatibleRecord['format'] = formatHint ?? (version === 1 ? 'historical-v1' : version === 2 ? 'historical-v2' : version === 3 ? 'historical-v3' : 'current')
    const id = forcedId ?? (validId(value.id) ? value.id : '')
    if (!id) return null

    if (isCurrentCharacterPayload({ ...value, id, kind: 'character' })) {
        const current = clone(value as unknown as Character)
        current.id = id
        current.schemaVersion = 3
        current.kind = 'character'
        current.ruleset = readRuleset(value)
        return preserveCompatibility(current, value, sourceKey, format)
    }
    // Some old v1/v2/v3 records relied on their versioned key instead of an
    // embedded schemaVersion. The key hint is authoritative for those records.
    const hasHistoricalKeyHint = formatHint === 'historical-v1'
        || formatHint === 'historical-v2'
        || formatHint === 'historical-v3'
    if (version === undefined && !hasHistoricalKeyHint) return null

    const identity = recordAt(value, 'identity')
    const abilities = numericMap(value.abilities)
    const combat = recordAt(value, 'combat')
    const oldArmor = combat?.armorClass
    const oldArmorRecord = isRecord(oldArmor) ? oldArmor : null
    const oldHitPoints = recordAt(combat, 'hitPoints')
    const oldHitDice = recordAt(combat, 'hitDice')
    const oldDeathSaves = recordAt(combat, 'deathSaves')
    const savingThrows = recordAt(value, 'savingThrows')
    const proficiency = recordAt(value, 'proficiency')
    const spellcasting = recordAt(value, 'spellcasting')
    const inventory = recordAt(value, 'inventory')
    const personality = recordAt(value, 'personality')
    const origin = recordAt(value, 'origin')
    if (!identity || !combat || !spellcasting || !inventory || !personality || !origin || ABILITY_KEYS.some(key => abilities[key] === undefined)) return null

    let next = createEmptyCharacter()
    next.id = id
    next.schemaVersion = 3
    next.kind = value.kind === 'npc' ? 'npc' : 'character'
    next.ruleset = readRuleset(value)
    next.identity.name = string(identity.name, string(identity.characterName, ''))
    next.identity.class = string(identity.class)
    next.identity.subclass = string(identity.subclass)
    next.identity.level = Math.max(1, finite(identity.level, 1))
    next.identity.experience = Math.max(0, finite(identity.experience, 0))
    next.identity.alignment = string(identity.alignment)
    const race = recordAt(identity, 'race')
    if (race) {
        next.identity.race = {
            name: string(race.name), subrace: string(race.subrace), size: string(race.size),
            abilityBonuses: numericMap(race.abilityBonuses), traits: stringArray(race.traits), languages: stringArray(race.languages),
        }
    }
    const background = recordAt(identity, 'background')
    if (background) {
        next.identity.background = {
            name: string(background.name), feature: string(background.feature), notes: string(background.notes),
            skillProficiencies: stringArray(background.skillProficiencies), toolProficiencies: stringArray(background.toolProficiencies), languages: stringArray(background.languages),
        }
    }
    next.abilities = Object.fromEntries(ABILITY_KEYS.map(key => [key, abilities[key] ?? 10])) as Character['abilities']
    if (savingThrows) {
        next.savingThrows = Object.fromEntries(ABILITY_KEYS.map(key => [key, {
            proficient: recordAt(savingThrows, key)?.proficient === true,
        }])) as Character['savingThrows']
    }
    if (proficiency) {
        next.proficiency = {
            toolProficiencies: stringArray(proficiency.toolProficiencies),
            languageProficiencies: stringArray(proficiency.languageProficiencies),
        }
    }
    const oldSpeed = combat.speed
    const speed = isRecord(oldSpeed)
        ? finite(oldSpeed.override, finite(oldSpeed.base, 0))
        : finite(oldSpeed, 0)
    next.combat = {
        armorClass: {
            mode: oldArmorRecord?.mode === 'computed' ? 'computed' : 'manual',
            value: finite(oldArmorRecord?.value, finite(oldArmor, 10)),
            armorBase: oldArmorRecord && (oldArmorRecord.armorBase === null || typeof oldArmorRecord.armorBase === 'number') ? oldArmorRecord.armorBase as number | null : null,
            armorDexCap: oldArmorRecord && (oldArmorRecord.armorDexCap === null || typeof oldArmorRecord.armorDexCap === 'number') ? oldArmorRecord.armorDexCap as number | null : null,
            shieldBonus: finite(oldArmorRecord?.shieldBonus, 0),
            additionalBonus: finite(oldArmorRecord?.additionalBonus, 0),
        },
        initiative: { additionalBonus: finite(recordAt(combat, 'initiative')?.additionalBonus, 0) },
        speed: Math.max(0, speed),
        hitPoints: {
            max: Math.max(0, finite(oldHitPoints?.max, 0)),
            current: Math.max(0, finite(oldHitPoints?.current, 0)),
            temporary: Math.max(0, finite(oldHitPoints?.temporary, 0)),
        },
        hitDice: { size: string(oldHitDice?.size), total: Math.max(0, finite(oldHitDice?.total, 0)), spent: Math.max(0, finite(oldHitDice?.spent, 0)) },
        deathSaves: { successes: Math.max(0, finite(oldDeathSaves?.successes, 0)), failures: Math.max(0, finite(oldDeathSaves?.failures, 0)) },
    }
    next.combat.hitPoints.current = Math.min(next.combat.hitPoints.current, next.combat.hitPoints.max)

    if (Array.isArray(value.skills)) {
        next.skills = value.skills.flatMap(skill => {
            if (!isRecord(skill) || typeof skill.name !== 'string') return []
            const ability = ABILITY_KEYS.includes(skill.ability as AbilityKey) ? skill.ability as AbilityKey : null
            const proficiencyMode = ['none', 'proficient', 'expertise'].includes(String(skill.proficiency)) ? skill.proficiency as Character['skills'][number]['proficiency'] : 'none'
            return [{ name: skill.name, value: finite(skill.value, 0), ability, proficiency: proficiencyMode, calculationMode: skill.calculationMode === 'computed' ? 'computed' as const : 'manual' as const, additionalBonus: finite(skill.additionalBonus, 0) }]
        })
    }
    if (Array.isArray(value.attacks)) {
        next.attacks = value.attacks.flatMap(attack => {
            if (!isRecord(attack) || typeof attack.name !== 'string') return []
            const sourceDamages = Array.isArray(attack.damages) ? attack.damages : [{
                damage: attack.damage, damageType: attack.damageType, additionalDamage: attack.additionalBonus,
                ability: attack.bonusSource, proficient: attack.proficient,
            }]
            const damages = sourceDamages.flatMap(damage => {
                if (!isRecord(damage)) return []
                return [{ damage: string(damage.damage), damageType: string(damage.damageType), additionalDamage: finite(damage.additionalDamage, 0), ability: ABILITY_KEYS.includes(damage.ability as AbilityKey) ? damage.ability as AbilityKey : null, proficient: damage.proficient === true }]
            })
            const rawRange = attack.range
            const range = typeof rawRange === 'number' ? rawRange : Number.parseInt(string(rawRange), 10)
            return [{ name: attack.name, kind: ['melee', 'ranged', 'spell', 'other'].includes(String(attack.kind)) ? attack.kind as Character['attacks'][number]['kind'] : 'other', damages, range: Number.isFinite(range) ? range : 0, description: string(attack.description) }]
        })
    }
    const mapSpells = (items: unknown) => Array.isArray(items) ? items.flatMap(spell => {
        if (!isRecord(spell) || typeof spell.name !== 'string') return []
        return [{ name: spell.name, level: finite(spell.level, 0), description: string(spell.description), school: string(spell.school), castingTime: string(spell.castingTime), range: string(spell.range), components: string(spell.components), duration: string(spell.duration), concentration: spell.concentration === true, ritual: spell.ritual === true }]
    }) : []
    next.spellcasting.knownSpells = mapSpells(spellcasting.knownSpells).map(spell => ({ ...spell, prepared: false }))
    next.spellcasting.cantrips = mapSpells(spellcasting.cantrips)
    const oldSlots = recordAt(spellcasting, 'spellSlots')
    if (oldSlots) {
        for (let level = 1; level <= 9; level += 1) {
            const slot = recordAt(oldSlots, String(level))
            if (slot) next.spellcasting.spellSlots[level as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9] = { max: Math.max(0, finite(slot.max, 0)), used: Math.max(0, finite(slot.used, 0)) }
        }
    }
    const oldItems = Array.isArray(inventory.items) ? inventory.items : []
    next.inventory.items = oldItems.flatMap(item => {
        if (!isRecord(item) || typeof item.name !== 'string') return []
        return [{ name: item.name, quantity: Math.max(0, finite(item.quantity, 0)), weight: typeof item.weight === 'number' ? item.weight : null, description: string(item.description), equipped: item.equipped === true, properties: Array.isArray(item.properties) ? stringArray(item.properties).join(', ') : string(item.properties) }]
    })
    const money = recordAt(inventory, 'money')
    if (money) next.inventory.money = { copper: finite(money.copper, 0), silver: finite(money.silver, 0), electrum: finite(money.electrum, 0), gold: finite(money.gold, 0), platinum: finite(money.platinum, 0) }
    next.personality = {
        traits: string(personality.traits), ideals: string(personality.ideals), bonds: string(personality.bonds), flaws: string(personality.flaws), biography: string(personality.biography), features: string(personality.features),
    }
    next.origin = {
        species: string(origin.species), background: string(origin.background), originFeat: string(origin.originFeat), languages: stringArray(origin.languages), tools: stringArray(origin.tools),
    }
    if (Array.isArray(value.feats)) next.feats = clone(value.feats) as Character['feats']
    if (Array.isArray(value.encounters)) next.encounters = clone(value.encounters) as Character['encounters']
    const npc = npcProfile(value.npc)
    if (npc) next.npc = npc
    const oldExtensions = recordAt(value, 'extensions') ?? {}
    next.extensions = { ...clone(oldExtensions) }
    next = preserveCompatibility(next, value, sourceKey, format)
    return next
}

function browserStorage(): CharacterStorageLike {
    if (typeof window === 'undefined') throw new Error('Локальное хранилище недоступно вне браузера.')
    return window.localStorage
}

function keyList(storage: CharacterStorageLike): string[] {
    if (!storage.key || typeof storage.length !== 'number') return []
    return Array.from({ length: storage.length }, (_, index) => storage.key?.(index) ?? '').filter(Boolean)
}

function parseEnvelope(raw: string): StoredEnvelope | null {
    try {
        const value: unknown = JSON.parse(raw)
        if (!isRecord(value) || value.adapterVersion !== 1 || !validId(value.id) || !['character', 'npc'].includes(String(value.kind))) return null
        if (!isRecord(value.character)) return null
        const character = value.character as unknown as Character
        const currentAsCharacter = { ...character, kind: 'character' }
        if (!isCurrentCharacterPayload(currentAsCharacter)) return null
        if (value.kind === 'npc' && !npcProfile(character.npc)) return null
        return value as unknown as StoredEnvelope
    } catch {
        return null
    }
}

function sourceKeys(storage: CharacterStorageLike): { key: string; format: CompatibleRecord['format']; id: string }[] {
    return keyList(storage).flatMap(key => {
        if (key.startsWith(CHARACTER_COLLECTION_PREFIX) || key.startsWith(NPC_COLLECTION_PREFIX) || key === LEGACY_MONSTER_KEY || key === 'nastolka:character-sheet') return []
        let id = ''
        let format: CompatibleRecord['format'] = 'historical-v3'
        if (key.startsWith(`${HISTORICAL_CHARACTER_PREFIX}v1:`)) { id = key.slice(`${HISTORICAL_CHARACTER_PREFIX}v1:`.length); format = 'historical-v1' }
        else if (key.startsWith(`${HISTORICAL_CHARACTER_PREFIX}v2:`)) { id = key.slice(`${HISTORICAL_CHARACTER_PREFIX}v2:`.length); format = 'historical-v2' }
        else if (key.startsWith(`${HISTORICAL_CHARACTER_PREFIX}v3:`)) { id = key.slice(`${HISTORICAL_CHARACTER_PREFIX}v3:`.length); format = 'historical-v3' }
        else if (key.startsWith(HISTORICAL_CHARACTER_PREFIX)) {
            id = key.slice(HISTORICAL_CHARACTER_PREFIX.length)
            if (!id || ['index', 'active'].includes(id) || id.startsWith('legacy:')) return []
        } else return []
        return validId(id) ? [{ key, format, id }] : []
    })
}

function attachCanonicalCharacter(envelope: StoredEnvelope): CompatibleRecord {
    const character = clone(envelope.character)
    character.id = envelope.id
    character.schemaVersion = 3
    character.kind = envelope.kind
    return { id: envelope.id, kind: envelope.kind, character, sourceKey: `${envelope.kind === 'npc' ? NPC_COLLECTION_PREFIX : CHARACTER_COLLECTION_PREFIX}${envelope.id}`, format: 'current', sourceRecord: envelope.sourceRecord }
}

function buildRecord(value: unknown, id: string, key: string, format: CompatibleRecord['format']): CompatibleRecord | null {
    if (!isRecord(value)) return null
    const kind: CollectionKind = value.kind === 'npc' || key === LEGACY_MONSTER_KEY ? 'npc' : 'character'
    if (kind === 'npc' && key === LEGACY_MONSTER_KEY && !isRecord(value.identity)) {
        const profile = npcProfile(value)
        if (!profile) return null
        const character = createEmptyCharacter()
        character.id = id
        character.kind = 'npc'
        character.ruleset = '2024'
        character.npc = profile
        character.extensions[COMPATIBILITY_EXTENSION] = { sourceKey: key, sourceFormat: 'legacy-monster' }
        return { id, kind, character, sourceKey: key, format: 'legacy-monster', sourceRecord: clone(value) }
    }
    const character = adaptHistoricalCharacter(value, key, id, format)
    if (!character) return null
    character.kind = kind
    return { id, kind, character, sourceKey: key, format, sourceRecord: clone(value) }
}

export function listCompatibleRecords(storage: CharacterStorageLike = browserStorage()): CollectionReadResult {
    const issues: StorageIssue[] = []
    const candidates: CompatibleRecord[] = []
    const seenCanonical = new Map<string, CompatibleRecord>()
    for (const key of keyList(storage)) {
        const isCharacterKey = key.startsWith(CHARACTER_COLLECTION_PREFIX) && ![CHARACTER_COLLECTION_INDEX_KEY, CHARACTER_COLLECTION_ACTIVE_KEY].includes(key) && !key.startsWith(CHARACTER_TOMBSTONE_PREFIX)
        const isNpcKey = key.startsWith(NPC_COLLECTION_PREFIX) && ![NPC_COLLECTION_INDEX_KEY, NPC_COLLECTION_ACTIVE_KEY].includes(key) && !key.startsWith(NPC_TOMBSTONE_PREFIX)
        if (!isCharacterKey && !isNpcKey) continue
        const prefix = isNpcKey ? NPC_COLLECTION_PREFIX : CHARACTER_COLLECTION_PREFIX
        const id = key.slice(prefix.length)
        const raw = storage.getItem(key)
        const envelope = raw === null ? null : parseEnvelope(raw)
        if (!envelope || envelope.id !== id || (isNpcKey ? envelope.kind !== 'npc' : envelope.kind !== 'character')) {
            issues.push({ key, message: 'Запись в новом хранилище повреждена или имеет неподдерживаемый формат.' })
            continue
        }
        const record = attachCanonicalCharacter(envelope)
        const tombstone = `${record.kind === 'npc' ? NPC_TOMBSTONE_PREFIX : CHARACTER_TOMBSTONE_PREFIX}${record.id}`
        if (storage.getItem(tombstone) !== null) continue
        if (record.sourceRecord === undefined && envelope.sourceKey) {
            const sourceRaw = storage.getItem(envelope.sourceKey)
            if (sourceRaw !== null) {
                try { record.sourceRecord = JSON.parse(sourceRaw) as unknown } catch { /* source remains untouched */ }
            }
        }
        candidates.push(record)
        seenCanonical.set(`${record.kind}:${record.id}`, record)
    }

    for (const source of sourceKeys(storage)) {
        const raw = storage.getItem(source.key)
        if (raw === null) continue
        let value: unknown
        try { value = JSON.parse(raw) as unknown } catch {
            issues.push({ key: source.key, message: 'Сохранение содержит повреждённый JSON и оставлено без изменений.' })
            continue
        }
        const record = buildRecord(value, source.id, source.key, source.format)
        if (!record) {
            issues.push({ key: source.key, message: 'Формат сохранения не распознан; исходная запись сохранена без изменений.' })
            continue
        }
        const tombstone = `${record.kind === 'npc' ? NPC_TOMBSTONE_PREFIX : CHARACTER_TOMBSTONE_PREFIX}${record.id}`
        if (storage.getItem(tombstone) !== null) continue
        const canonical = seenCanonical.get(`${record.kind}:${record.id}`)
        if (canonical) {
            const compat = compatibilityOf(canonical.character)
            if (compat?.sourceKey === source.key) continue
            issues.push({ key: source.key, message: `Совпадает ID «${record.id}» с другой записью; автоматическое объединение не выполнено.` })
            continue
        }
        candidates.push(record)
    }

    const singleRaw = storage.getItem('nastolka:character-sheet')
    if (singleRaw !== null) {
        try {
            const parsed: unknown = JSON.parse(singleRaw)
            const id = isRecord(parsed) && validId(parsed.id) ? parsed.id : 'active-sheet'
            const record = buildRecord(parsed, id, 'nastolka:character-sheet', 'legacy-single')
            if (!record) issues.push({ key: 'nastolka:character-sheet', message: 'Активная запись не распознана; она сохранена без изменений.' })
            else {
                const tombstone = `${CHARACTER_TOMBSTONE_PREFIX}${record.id}`
                const existing = candidates.find(item => item.id === record.id && item.kind === record.kind)
                if (storage.getItem(tombstone) === null && !existing) candidates.push(record)
                else if (existing && JSON.stringify(existing.character) !== JSON.stringify(record.character) && compatibilityOf(existing.character)?.sourceKey !== record.sourceKey)
                    issues.push({ key: record.sourceKey, message: `Совпадает ID «${record.id}» с другой записью; активный лист оставлен отдельно.` })
            }
        } catch {
            issues.push({ key: 'nastolka:character-sheet', message: 'Активный лист содержит повреждённый JSON и оставлен без изменений.' })
        }
    }

    const monsterRaw = storage.getItem(LEGACY_MONSTER_KEY)
    if (monsterRaw !== null) {
        try {
            const parsed: unknown = JSON.parse(monsterRaw)
            const profile = isRecord(parsed) && isRecord(parsed.npc) ? parsed.npc : parsed
            const id = isRecord(parsed) && validId(parsed.id) ? parsed.id : 'legacy-monster-sheet'
            const record = buildRecord(profile, id, LEGACY_MONSTER_KEY, 'legacy-monster')
            if (!record) issues.push({ key: LEGACY_MONSTER_KEY, message: 'Старый лист НПС не распознан и оставлен без изменений.' })
            else if (
                storage.getItem(`${NPC_TOMBSTONE_PREFIX}${id}`) === null &&
                !candidates.some(item => item.kind === 'npc' && item.id === id)
            ) {
                record.sourceRecord = clone(parsed)
                candidates.push(record)
            }
        } catch {
            issues.push({ key: LEGACY_MONSTER_KEY, message: 'Старый лист НПС содержит повреждённый JSON и оставлен без изменений.' })
        }
    }

    const ids = new Map<string, CompatibleRecord>()
    const collisionIds = new Set<string>()
    for (const record of candidates) {
        const prior = ids.get(record.id)
        if (prior) {
            collisionIds.add(record.id)
            const conflictLabel = prior.kind !== record.kind ? 'персонажем и НПС' : 'несколькими записями'
            issues.push({ key: record.sourceKey, message: `ID «${record.id}» используется ${conflictLabel}; запись не будет автоматически выбрана.` })
        }
        ids.set(record.id, record)
    }
    const filtered = candidates.filter(record => !collisionIds.has(record.id))
    return {
        characters: filtered.filter(record => record.kind === 'character'),
        npcs: filtered.filter(record => record.kind === 'npc'),
        issues,
    }
}

function readIndex(storage: CharacterStorageLike, key: string): string[] {
    try {
        const value: unknown = JSON.parse(storage.getItem(key) ?? '[]')
        return Array.isArray(value) ? [...new Set(value.filter(validId))] : []
    } catch { return [] }
}

function envelopeFor(record: CompatibleRecord): StoredEnvelope {
    const sourceKey = compatibilityOf(record.character)?.sourceKey
    const sourceRecord = compatibilityOf(record.character)?.sourceRecord
    return {
        adapterVersion: 1,
        id: record.id,
        kind: record.kind,
        character: { ...clone(record.character), id: record.id, schemaVersion: 3, kind: record.kind },
        ...(typeof sourceKey === 'string' ? { sourceKey } : {}),
        ...(sourceRecord !== undefined ? { sourceRecord: clone(sourceRecord) } : {}),
    }
}

function persistRecord(record: CompatibleRecord, storage: CharacterStorageLike): void {
    const prefix = record.kind === 'npc' ? NPC_COLLECTION_PREFIX : CHARACTER_COLLECTION_PREFIX
    const indexKey = record.kind === 'npc' ? NPC_COLLECTION_INDEX_KEY : CHARACTER_COLLECTION_INDEX_KEY
    const targetKey = `${prefix}${record.id}`
    const currentRaw = storage.getItem(targetKey)
    if (currentRaw !== null) {
        const current = parseEnvelope(currentRaw)
        if (!current || current.id !== record.id || current.kind !== record.kind)
            throw new Error(`Конфликт ID «${record.id}»: запись не была перезаписана.`)
    }
    storage.setItem(targetKey, JSON.stringify(envelopeFor(record)))
    const ids = new Set(readIndex(storage, indexKey))
    ids.add(record.id)
    storage.setItem(indexKey, JSON.stringify([...ids]))
}

/** Copies valid legacy records into the new adapter namespace without deleting source keys. */
export function migrateCompatibleStorage(storage: CharacterStorageLike = browserStorage()): CollectionReadResult {
    const result = listCompatibleRecords(storage)
    const planned = [...result.characters, ...result.npcs]
    const byId = new Set<string>()
    for (const record of planned) {
        if (byId.has(record.id)) throw new Error(`Конфликт ID «${record.id}»: перенос остановлен, исходные данные сохранены.`)
        byId.add(record.id)
        const prefix = record.kind === 'npc' ? NPC_COLLECTION_PREFIX : CHARACTER_COLLECTION_PREFIX
        const target = storage.getItem(`${prefix}${record.id}`)
        if (target !== null) {
            const parsed = parseEnvelope(target)
            if (!parsed || parsed.id !== record.id || parsed.kind !== record.kind)
                throw new Error(`Конфликт ID «${record.id}»: перенос остановлен, исходные данные сохранены.`)
        }
        if (!isCurrentCharacterPayload({ ...record.character, kind: 'character' }))
            throw new Error(`Запись «${record.id}» не прошла проверку; перенос остановлен.`)
    }
    for (const record of planned) persistRecord(record, storage)
    const previousActive = storage.getItem(HISTORICAL_CHARACTER_ACTIVE_KEY)?.trim()
    const targetActive = previousActive && planned.some(record => record.id === previousActive && record.kind === 'character')
        ? previousActive
        : storage.getItem(CHARACTER_COLLECTION_ACTIVE_KEY) ?? planned.find(record => record.kind === 'character')?.id ?? ''
    if (storage.getItem(CHARACTER_COLLECTION_ACTIVE_KEY) === null && targetActive)
        storage.setItem(CHARACTER_COLLECTION_ACTIVE_KEY, targetActive)
    return listCompatibleRecords(storage)
}

export function getActiveCompatibleCharacterId(storage: CharacterStorageLike = browserStorage()): string | null {
    const current = storage.getItem(CHARACTER_COLLECTION_ACTIVE_KEY)
    if (current !== null) return current.trim() || null
    const historical = storage.getItem(HISTORICAL_CHARACTER_ACTIVE_KEY)
    return historical?.trim() || null
}

export function getActiveCompatibleNpcId(storage: CharacterStorageLike = browserStorage()): string | null {
    const current = storage.getItem(NPC_COLLECTION_ACTIVE_KEY)
    if (current !== null) return current.trim() || null
    return null
}

export function setActiveCompatibleCharacterId(id: string | null, storage: CharacterStorageLike = browserStorage()): void {
    storage.setItem(CHARACTER_COLLECTION_ACTIVE_KEY, id ?? '')
}

export function setActiveCompatibleNpcId(id: string | null, storage: CharacterStorageLike = browserStorage()): void {
    storage.setItem(NPC_COLLECTION_ACTIVE_KEY, id ?? '')
}

export function findCompatibleRecord(id: string, kind: CollectionKind, storage: CharacterStorageLike = browserStorage()): CompatibleRecord | null {
    const result = listCompatibleRecords(storage)
    return (kind === 'npc' ? result.npcs : result.characters).find(record => record.id === id) ?? null
}

export function saveCompatibleRecord(character: Character, storage: CharacterStorageLike = browserStorage(), kind: CollectionKind = character.kind === 'npc' ? 'npc' : 'character'): CompatibleRecord {
    const id = character.id
    if (!validId(id)) throw new Error('У записи отсутствует корректный ID.')
    const normalized = { ...clone(character), id, schemaVersion: 3 as const, kind, ruleset: character.ruleset ?? '2024' }
    if (!isCurrentCharacterPayload({ ...normalized, kind: 'character' })) throw new Error('Данные листа не прошли проверку; сохранение не выполнено.')
    if (kind === 'npc' && !npcProfile(normalized.npc)) throw new Error('У записи НПС отсутствует корректный профиль существа.')
    const list = listCompatibleRecords(storage)
    const otherKind = kind === 'npc' ? list.characters : list.npcs
    if (otherKind.some(record => record.id === normalized.id)) throw new Error(`Конфликт ID «${normalized.id}»: ID уже принадлежит ${kind === 'npc' ? 'персонажу' : 'НПС'}.`)
    const extension = compatibilityOf(normalized)
    const sourceKey = typeof extension?.sourceKey === 'string' ? extension.sourceKey : `${kind}:${normalized.id}`
    const record: CompatibleRecord = { id: normalized.id, kind, character: normalized, sourceKey, format: 'current' }
    persistRecord(record, storage)
    if (kind === 'character') setActiveCompatibleCharacterId(record.id, storage)
    else setActiveCompatibleNpcId(record.id, storage)
    return record
}

export function createCompatibleNpc(profile: CharacterNpc, id = makeId('npc')): Character {
    const character = createEmptyCharacter()
    character.id = id
    character.kind = 'npc'
    character.identity.name = profile.name
    character.npc = clone(profile)
    return character
}

export function deleteCompatibleRecord(id: string, kind: CollectionKind, storage: CharacterStorageLike = browserStorage()): void {
    const prefix = kind === 'npc' ? NPC_COLLECTION_PREFIX : CHARACTER_COLLECTION_PREFIX
    const indexKey = kind === 'npc' ? NPC_COLLECTION_INDEX_KEY : CHARACTER_COLLECTION_INDEX_KEY
    const tombstonePrefix = kind === 'npc' ? NPC_TOMBSTONE_PREFIX : CHARACTER_TOMBSTONE_PREFIX
    const raw = storage.getItem(`${prefix}${id}`)
    const sources = listCompatibleRecords(storage)
    const legacySourceExists = [...sources.characters, ...sources.npcs].some(record => {
        if (record.id !== id || record.kind !== kind) return false
        const originalSourceKey = compatibilityOf(record.character)?.sourceKey
        return typeof originalSourceKey === 'string' && (
            originalSourceKey === LEGACY_MONSTER_KEY ||
            originalSourceKey === 'nastolka:character-sheet' ||
            originalSourceKey.startsWith(HISTORICAL_CHARACTER_PREFIX)
        )
    })
    if (legacySourceExists) storage.setItem(`${tombstonePrefix}${id}`, 'deleted')
    else if (raw !== null) storage.removeItem?.(`${prefix}${id}`)
    storage.setItem(indexKey, JSON.stringify(readIndex(storage, indexKey).filter(storedId => storedId !== id)))
    if (kind === 'character' && getActiveCompatibleCharacterId(storage) === id) setActiveCompatibleCharacterId(null, storage)
    if (kind === 'npc' && getActiveCompatibleNpcId(storage) === id) setActiveCompatibleNpcId(null, storage)
}

export function copyCompatibleRecord(record: CompatibleRecord, storage: CharacterStorageLike = browserStorage()): CompatibleRecord {
    const id = makeId(record.kind)
    const character = clone(record.character)
    character.id = id
    character.kind = record.kind
    character.identity.name = `${character.identity.name || character.identity.class || (record.kind === 'npc' ? 'Новый НПС' : 'Новый персонаж')} (копия)`
    const sourceMetadata = compatibilityOf(character)
    character.extensions[COMPATIBILITY_EXTENSION] = {
        sourceKey: `copy:${record.id}`,
        sourceFormat: 'copy',
        ...(record.sourceRecord !== undefined ? { sourceRecord: clone(record.sourceRecord) } : {}),
        ...(sourceMetadata?.sourceId !== undefined ? { sourceId: sourceMetadata.sourceId } : {}),
    }
    const copied = saveCompatibleRecord(character, storage, record.kind)
    return copied
}

export interface CharacterSheetCompatibilityAdapter {
    list(): CollectionReadResult
    migrate(): CollectionReadResult
    load(id: string, kind?: CollectionKind): Character | null
    save(character: Character, kind?: CollectionKind): CompatibleRecord
    activeId(): string | null
    setActive(id: string | null, kind?: CollectionKind): void
}

/** Small adapter boundary for the single-record UI and the restored historical collection. */
export function createCharacterSheetCompatibilityAdapter(
    options: { storage?: CharacterStorageLike } = {},
): CharacterSheetCompatibilityAdapter {
    const storage = () => options.storage ?? browserStorage()
    return {
        list: () => listCompatibleRecords(storage()),
        migrate: () => migrateCompatibleStorage(storage()),
        load: (id, kind = 'character') => findCompatibleRecord(id, kind, storage())?.character ?? null,
        save: (value, kind = value.kind === 'npc' ? 'npc' : 'character') => saveCompatibleRecord(value, storage(), kind),
        activeId: () => getActiveCompatibleCharacterId(storage()),
        setActive: (id, kind = 'character') => kind === 'npc'
            ? setActiveCompatibleNpcId(id, storage())
            : setActiveCompatibleCharacterId(id, storage()),
    }
}
