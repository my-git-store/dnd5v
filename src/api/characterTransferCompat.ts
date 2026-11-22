import {
    adaptHistoricalCharacter,
    listCompatibleRecords,
    saveCompatibleRecord,
    type CollectionKind,
    type CompatibleRecord,
    type StorageIssue,
} from './characterCollectionCompat.ts'
import { isCurrentCharacterPayload, type CharacterStorageLike } from './characterStorage.ts'
import type { Character } from '../types/character.ts'

export const CHARACTER_TRANSFER_MAX_BYTES = 4 * 1024 * 1024
const MAX_IMPORT_RECORDS = 100

export interface TransferItem {
    id: string
    kind: CollectionKind
    character: Character
    /** Complete historical source record, retained when the current editor cannot display all fields. */
    sourceRecord?: unknown
}

export interface CharacterTransferEnvelope {
    schemaVersion: 3
    exportVersion: 2
    exportedAt: string
    characters: TransferItem[]
    npcs: TransferItem[]
}

export interface ImportedCharacterPlan {
    characters: TransferItem[]
    npcs: TransferItem[]
    exportedAt?: string
}

export interface ImportResult {
    importedCharacterIds: string[]
    importedNpcIds: string[]
    renamedIds: Array<{ from: string; to: string; kind: CollectionKind }>
    issues: StorageIssue[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

function makeId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isValidId(value: string): boolean {
    return /^[\p{L}\p{N}_.:-]{1,160}$/u.test(value)
}

export function createCharacterTransfer(
    records: CompatibleRecord[],
    exportedAt = new Date().toISOString(),
): CharacterTransferEnvelope {
    const items = records.map(record => ({
        id: record.id,
        kind: record.kind,
        character: clone(record.character),
        ...(record.sourceRecord !== undefined ? { sourceRecord: clone(record.sourceRecord) } : {}),
    }))
    return {
        schemaVersion: 3,
        exportVersion: 2,
        exportedAt,
        characters: items.filter(item => item.kind === 'character'),
        npcs: items.filter(item => item.kind === 'npc'),
    }
}

export function serializeCharacterTransfer(
    records: CompatibleRecord[],
    exportedAt = new Date().toISOString(),
): string {
    return JSON.stringify(createCharacterTransfer(records, exportedAt), null, 2)
}

function parseTransferItem(value: unknown, index: number, forcedKind?: CollectionKind): TransferItem {
    if (!isRecord(value)) throw new Error(`Запись ${index + 1} имеет неверный формат.`)
    const explicitKind = forcedKind ?? (value.kind === 'npc' ? 'npc' : 'character')
    const rawCharacter = isRecord(value.character) ? value.character : value
    const id = typeof value.id === 'string' && value.id.trim()
        ? value.id
        : typeof rawCharacter.id === 'string' && rawCharacter.id.trim()
          ? rawCharacter.id
          : `import-${makeId()}`
    if (!isValidId(id)) throw new Error(`Запись ${index + 1} содержит недопустимый ID.`)
    let character: Character | null = null
    if (isCurrentCharacterPayload({ ...rawCharacter, id, kind: 'character' })) {
        character = clone(rawCharacter as unknown as Character)
        character.id = id
        character.schemaVersion = 3
        character.kind = explicitKind
        character.ruleset = character.ruleset ?? '2024'
    } else {
        character = adaptHistoricalCharacter(rawCharacter, `import:${index + 1}`, id)
        if (character) character.kind = explicitKind
    }
    if (!character) throw new Error(`Запись ${index + 1} не прошла проверку структуры.`)
    if (explicitKind === 'npc' && !character.npc)
        throw new Error(`Запись НПС ${index + 1} не содержит профиль существа.`)
    if (explicitKind === 'character' && character.kind === 'npc') character.kind = 'character'
    const compatibility = isRecord(character.extensions.__nastolkaStorageCompatibility)
        ? character.extensions.__nastolkaStorageCompatibility
        : {}
    character.extensions.__nastolkaStorageCompatibility = {
        ...compatibility,
        ...(value.sourceRecord !== undefined ? { sourceRecord: clone(value.sourceRecord) } : {}),
    }
    return { id, kind: explicitKind, character, ...(value.sourceRecord !== undefined ? { sourceRecord: clone(value.sourceRecord) } : {}) }
}

export function parseCharacterTransfer(raw: string): ImportedCharacterPlan {
    if (new TextEncoder().encode(raw).byteLength > CHARACTER_TRANSFER_MAX_BYTES)
        throw new Error('Файл импорта слишком большой.')
    let parsed: unknown
    try { parsed = JSON.parse(raw) as unknown } catch { throw new Error('Файл импорта содержит некорректный JSON.') }
    if (!isRecord(parsed)) throw new Error('Ожидался файл персонажа или пакет персонажей.')
    const exportedAt = typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined

    let charactersSource: unknown[]
    let npcsSource: unknown[]
    if (Array.isArray(parsed.characters) && (parsed.exportVersion === 1 || parsed.exportVersion === 2)) {
        if (parsed.schemaVersion !== 3) throw new Error('Неподдерживаемая версия пакета персонажей.')
        charactersSource = parsed.characters
        npcsSource = Array.isArray(parsed.npcs) ? parsed.npcs : []
        if (parsed.exportVersion === 1) {
            const mixed = charactersSource
            charactersSource = mixed.filter(value => !isRecord(value) || value.kind !== 'npc')
            npcsSource = [...npcsSource, ...mixed.filter(value => isRecord(value) && value.kind === 'npc')]
        }
    } else if (Array.isArray(parsed.characters)) {
        throw new Error('Неподдерживаемая версия пакета персонажей.')
    } else if (parsed.kind === 'npc') {
        charactersSource = []
        npcsSource = [parsed]
    } else {
        charactersSource = [parsed]
        npcsSource = []
    }
    if (charactersSource.length + npcsSource.length === 0) throw new Error('В файле нет персонажей или НПС.')
    if (charactersSource.length + npcsSource.length > MAX_IMPORT_RECORDS)
        throw new Error(`В одном файле можно импортировать не более ${MAX_IMPORT_RECORDS} записей.`)
    const characters = charactersSource.map((value, index) => parseTransferItem(value, index, 'character'))
    const npcs = npcsSource.map((value, index) => parseTransferItem(value, index, 'npc'))
    const seen = new Set<string>()
    for (const item of [...characters, ...npcs]) {
        if (seen.has(item.id)) throw new Error(`В файле повторяется ID «${item.id}». Импорт не выполнен.`)
        seen.add(item.id)
    }
    return { characters, npcs, exportedAt }
}

export function exportStoredCharacters(storage: CharacterStorageLike): string {
    const result = listCompatibleRecords(storage)
    if (result.issues.length) throw new Error('В хранилище есть несовместимые записи. Сначала разрешите предупреждения; экспорт не выполнен.')
    return serializeCharacterTransfer([...result.characters, ...result.npcs])
}

export function importCharacterTransfer(
    plan: ImportedCharacterPlan,
    storage: CharacterStorageLike,
    options: { mode: 'add' | 'replace'; activeCharacterId?: string | null },
): ImportResult {
    const before = listCompatibleRecords(storage)
    if (before.issues.length) throw new Error('В хранилище есть конфликты записей. Импорт остановлен без изменений.')
    const usedIds = new Set([...before.characters, ...before.npcs].map(record => record.id))
    const importedCharacterIds: string[] = []
    const importedNpcIds: string[] = []
    const renamedIds: ImportResult['renamedIds'] = []
    const allItems = [...plan.characters, ...plan.npcs]
    const writes: TransferItem[] = []
    for (const [index, item] of allItems.entries()) {
        const character = clone(item.character)
        const targetKind = item.kind
        const replacingCurrent = options.mode === 'replace' && index === 0 && targetKind === 'character' && options.activeCharacterId
        const originalId = replacingCurrent ? options.activeCharacterId as string : item.id
        let nextId = originalId
        if (usedIds.has(nextId) && !replacingCurrent) {
            nextId = `${item.id}-import-${makeId()}`
            renamedIds.push({ from: item.id, to: nextId, kind: targetKind })
        }
        if (usedIds.has(nextId) && replacingCurrent) {
            const activeExists = [...before.characters, ...before.npcs].some(record => record.id === nextId && record.kind === targetKind)
            if (!activeExists) throw new Error('Активная запись для замены больше не найдена; импорт остановлен.')
        }
        character.id = nextId
        character.kind = targetKind
        const compatibility = isRecord(character.extensions.__nastolkaStorageCompatibility)
            ? character.extensions.__nastolkaStorageCompatibility
            : {}
        const previousRecord = replacingCurrent
            ? before.characters.find(record => record.id === nextId)
            : undefined
        const previousCompatibility = previousRecord && isRecord(previousRecord.character.extensions.__nastolkaStorageCompatibility)
            ? previousRecord.character.extensions.__nastolkaStorageCompatibility
            : undefined
        const replacedSources = [previousRecord?.sourceRecord, item.sourceRecord].filter(value => value !== undefined)
        character.extensions.__nastolkaStorageCompatibility = {
            ...compatibility,
            sourceKey: typeof previousCompatibility?.sourceKey === 'string'
                ? previousCompatibility.sourceKey
                : `import:${item.id}`,
            ...(previousCompatibility?.sourceFormat !== undefined ? { sourceFormat: previousCompatibility.sourceFormat } : {}),
            ...(replacedSources.length ? { sourceRecord: replacedSources.length === 1 ? clone(replacedSources[0]) : clone(replacedSources) } : {}),
        }
        writes.push({ ...item, id: nextId, kind: targetKind, character })
        usedIds.add(nextId)
    }
    // Validate all destinations before writing any record, so a collision cannot partially replace data.
    for (const item of writes) {
        if (!isCurrentCharacterPayload({ ...item.character, kind: 'character' }))
            throw new Error(`Запись «${item.id}» не прошла проверку; импорт не выполнен.`)
        if (item.kind === 'npc' && !item.character.npc)
            throw new Error(`Запись НПС «${item.id}» неполная; импорт не выполнен.`)
    }
    const beforeWrites = new Map<string, string | null>()
    const indexAndActiveKeys = [
        'nastolka:characters:v1:index',
        'nastolka:characters:v1:active',
        'nastolka:npcs:v1:index',
        'nastolka:npcs:v1:active',
    ]
    const metadataBefore = new Map(indexAndActiveKeys.map(key => [key, storage.getItem(key)]))
    for (const item of writes) {
        const prefix = item.kind === 'npc' ? 'nastolka:npcs:v1:' : 'nastolka:characters:v1:'
        beforeWrites.set(`${prefix}${item.id}`, storage.getItem(`${prefix}${item.id}`))
    }
    if ([...beforeWrites.values()].some(value => value === null) && !storage.removeItem)
        throw new Error('Хранилище не поддерживает безопасный откат; импорт не выполнен.')
    const writtenKeys: string[] = []
    try {
        for (const item of writes) {
            const record: CompatibleRecord = {
                ...item,
                sourceKey: `import:${item.id}`,
                format: 'current',
            }
            saveCompatibleRecord(record.character, storage, record.kind)
            writtenKeys.push(`${item.kind === 'npc' ? 'nastolka:npcs:v1:' : 'nastolka:characters:v1:'}${item.id}`)
            if (record.kind === 'character') importedCharacterIds.push(record.id)
            else importedNpcIds.push(record.id)
        }
    } catch (error) {
        for (const key of writtenKeys.reverse()) {
            const prior = beforeWrites.get(key) ?? null
            if (prior === null) storage.removeItem?.(key)
            else storage.setItem(key, prior)
        }
        for (const [key, value] of metadataBefore) {
            if (value === null) storage.removeItem?.(key)
            else storage.setItem(key, value)
        }
        throw new Error(error instanceof Error ? `${error.message} Записи импорта откатаны; исходные данные сохранены.` : 'Импорт не выполнен. Записи откатаны; исходные данные сохранены.')
    }
    return { importedCharacterIds, importedNpcIds, renamedIds, issues: [] }
}

export function transferFilename(name: string, date = new Date()): string {
    const safeName = name.trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'personazh'
    return `${safeName}-${date.toISOString().slice(0, 10)}.json`
}
