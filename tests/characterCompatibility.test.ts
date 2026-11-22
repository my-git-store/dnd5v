import assert from 'node:assert/strict'
import test from 'node:test'

import {
    CHARACTER_COLLECTION_ACTIVE_KEY,
    CHARACTER_COLLECTION_PREFIX,
    HISTORICAL_CHARACTER_ACTIVE_KEY,
    HISTORICAL_CHARACTER_INDEX_KEY,
    HISTORICAL_CHARACTER_PREFIX,
    LEGACY_MONSTER_KEY,
    NPC_COLLECTION_PREFIX,
    adaptHistoricalCharacter,
    copyCompatibleRecord,
    createCompatibleNpc,
    deleteCompatibleRecord,
    findCompatibleRecord,
    getActiveCompatibleCharacterId,
    listCompatibleRecords,
    migrateCompatibleStorage,
    saveCompatibleRecord,
    setActiveCompatibleCharacterId,
    type CompatibleRecord,
} from '../src/api/characterCollectionCompat.ts'
import {
    exportStoredCharacters,
    importCharacterTransfer,
    parseCharacterTransfer,
    serializeCharacterTransfer,
} from '../src/api/characterTransferCompat.ts'
import type { CharacterStorageLike } from '../src/api/characterStorage.ts'
import { createEmptyCharacter } from '../src/data/character.mock.ts'
import { createDefaultNpcProfile } from '../src/domain/npc.ts'
import { takeLongRest } from '../src/domain/rest.ts'

class MemoryStorage implements CharacterStorageLike {
    private readonly values = new Map<string, string>()
    failKey: string | null = null
    get length() { return this.values.size }
    getItem(key: string) { return this.values.get(key) ?? null }
    setItem(key: string, value: string) {
        if (key === this.failKey) throw new Error('simulated storage quota failure')
        this.values.set(key, value)
    }
    removeItem(key: string) { this.values.delete(key) }
    key(index: number) { return [...this.values.keys()][index] ?? null }
}

function historicalCharacter(id: string, ruleset: '2014' | '2024' = '2014'): Record<string, unknown> {
    const current = createEmptyCharacter()
    const value = JSON.parse(JSON.stringify(current)) as Record<string, unknown>
    value.id = id
    value.schemaVersion = 3
    value.kind = 'character'
    value.ruleset = ruleset
    const identity = value.identity as Record<string, unknown>
    identity.name = `Старый ${id}`
    identity.class = 'Воин'
    const combat = value.combat as Record<string, unknown>
    combat.speed = { base: 30, fly: null, swim: null, override: null }
    value.attacks = [{
        id: `weapon-${id}`, name: 'Старый меч', kind: 'melee', attackBonus: '+5', bonusSource: 'strength',
        proficient: true, calculationMode: 'computed', additionalBonus: 1, damage: '1d8+3',
        damageType: 'рубящий', properties: ['универсальное'], range: 5, description: 'Историческое описание атаки',
    }]
    const inventory = value.inventory as Record<string, unknown>
    inventory.items = [{ id: `item-${id}`, name: 'Старый предмет', quantity: 2, weight: 1, description: 'Тайное описание', equipped: true, properties: ['редкий', 'старый'], hiddenLegacyField: 'must-survive' }]
    value.unmappedLegacyField = { nested: ['preserve', 17] }
    value.extensions = { characterCreation: { ruleset, note: 'creation metadata' }, customExtension: { keep: true } }
    return value
}

function storeHistorical(storage: MemoryStorage, id: string, ruleset: '2014' | '2024' = '2014') {
    const key = `${HISTORICAL_CHARACTER_PREFIX}${id}`
    const raw = JSON.stringify(historicalCharacter(id, ruleset))
    storage.setItem(key, raw)
    storage.setItem(HISTORICAL_CHARACTER_INDEX_KEY, JSON.stringify([id]))
    storage.setItem(HISTORICAL_CHARACTER_ACTIVE_KEY, id)
    return { key, raw }
}

test('loads historical v3 records through the adapter while preserving the complete source', () => {
    const storage = new MemoryStorage()
    const { key, raw } = storeHistorical(storage, 'fighter-1')
    const result = listCompatibleRecords(storage)
    assert.equal(result.issues.length, 0)
    assert.equal(result.characters.length, 1)
    const record = result.characters[0]!
    assert.equal(record.character.identity.name, 'Старый fighter-1')
    assert.equal(record.character.ruleset, '2014')
    assert.equal(record.character.combat.speed, 30)
    assert.equal(record.character.attacks[0]?.damages[0]?.damage, '1d8+3')
    assert.equal(record.character.inventory.items[0]?.properties, 'редкий, старый')
    assert.deepEqual(record.sourceRecord, JSON.parse(raw))
    assert.equal(storage.getItem(key), raw)
})

test('migrates legacy collection and active ID idempotently without deleting source keys', () => {
    const storage = new MemoryStorage()
    const { key, raw } = storeHistorical(storage, 'fighter-2')
    const first = migrateCompatibleStorage(storage)
    const canonicalKey = `${CHARACTER_COLLECTION_PREFIX}fighter-2`
    const firstCanonical = storage.getItem(canonicalKey)
    const second = migrateCompatibleStorage(storage)
    assert.equal(first.characters.length, 1)
    assert.equal(second.characters.length, 1)
    assert.equal(storage.getItem(canonicalKey), firstCanonical)
    assert.equal(storage.getItem(key), raw)
    assert.equal(getActiveCompatibleCharacterId(storage), 'fighter-2')
    assert.equal(storage.getItem(CHARACTER_COLLECTION_ACTIVE_KEY), 'fighter-2')
})

test('keeps current single-record data in the internal collection and retains its original key', () => {
    const storage = new MemoryStorage()
    const current = createEmptyCharacter()
    current.id = 'single-1'
    current.identity.name = 'Одиночная запись'
    const raw = JSON.stringify(current)
    storage.setItem('nastolka:character-sheet', raw)
    const migrated = migrateCompatibleStorage(storage)
    assert.equal(migrated.characters[0]?.id, 'single-1')
    assert.equal(storage.getItem('nastolka:character-sheet'), raw)
    assert.ok(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}single-1`))
})

test('does not replace records on duplicate IDs and reports the conflict', () => {
    const storage = new MemoryStorage()
    const source = storeHistorical(storage, 'collision')
    const unrelated = createEmptyCharacter()
    unrelated.id = 'collision'
    unrelated.identity.name = 'Другой лист'
    saveCompatibleRecord(unrelated, storage)
    const canonicalBefore = storage.getItem(`${CHARACTER_COLLECTION_PREFIX}collision`)
    const result = listCompatibleRecords(storage)
    assert.ok(result.issues.some(issue => issue.message.includes('Совпадает ID')))
    assert.equal(storage.getItem(source.key), source.raw)
    assert.equal(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}collision`), canonicalBefore)
})

test('retains malformed legacy records and refuses to create a blank migration for them', () => {
    const storage = new MemoryStorage()
    const raw = '{damaged'
    storage.setItem(`${HISTORICAL_CHARACTER_PREFIX}broken`, raw)
    const result = migrateCompatibleStorage(storage)
    assert.equal(result.characters.length, 0)
    assert.ok(result.issues.some(issue => issue.key.endsWith('broken')))
    assert.equal(storage.getItem(`${HISTORICAL_CHARACTER_PREFIX}broken`), raw)
})

test('stores legacy NPCs in the separate NPC namespace and supports copy and delete tombstones', () => {
    const storage = new MemoryStorage()
    storage.setItem(LEGACY_MONSTER_KEY, JSON.stringify(createDefaultNpcProfile('Страж')))
    const migrated = migrateCompatibleStorage(storage)
    const npc = migrated.npcs[0]!
    assert.equal(migrated.characters.length, 0)
    assert.equal(npc.character.npc?.name, 'Страж')
    assert.ok(storage.getItem(`${NPC_COLLECTION_PREFIX}${npc.id}`))
    const copy = copyCompatibleRecord(npc, storage)
    assert.notEqual(copy.id, npc.id)
    assert.equal(listCompatibleRecords(storage).npcs.length, 2)
    deleteCompatibleRecord(npc.id, 'npc', storage)
    assert.equal(listCompatibleRecords(storage).npcs.length, 1)
    assert.notEqual(storage.getItem(LEGACY_MONSTER_KEY), null)
})

test('round-trips separately stored NPC records without merging them into characters', () => {
    const storage = new MemoryStorage()
    const npc = createCompatibleNpc(createDefaultNpcProfile('Тролль'), 'npc-1')
    saveCompatibleRecord(npc, storage, 'npc')
    const result = listCompatibleRecords(storage)
    assert.equal(result.characters.length, 0)
    assert.equal(result.npcs[0]?.character.npc?.name, 'Тролль')
})

test('exports and imports NPC records as a separate collection', () => {
    const source = new MemoryStorage()
    saveCompatibleRecord(createCompatibleNpc(createDefaultNpcProfile('Каменник'), 'npc-transfer'), source, 'npc')
    const plan = parseCharacterTransfer(exportStoredCharacters(source))
    const target = new MemoryStorage()
    importCharacterTransfer(plan, target, { mode: 'add' })
    const restored = listCompatibleRecords(target)
    assert.equal(restored.characters.length, 0)
    assert.equal(restored.npcs.length, 1)
    assert.equal(restored.npcs[0]?.character.npc?.name, 'Каменник')
})

test('legacy NPC wrapper keeps its unmapped fields through migration and export/import', () => {
    const source = new MemoryStorage()
    const legacy = {
        id: 'old-monster',
        npc: createDefaultNpcProfile('Старый страж'),
        rulesData: { customArmorNote: 'не отображаемое поле' },
    }
    const raw = JSON.stringify(legacy)
    source.setItem(LEGACY_MONSTER_KEY, raw)
    migrateCompatibleStorage(source)
    const plan = parseCharacterTransfer(exportStoredCharacters(source))
    assert.deepEqual(plan.npcs[0]?.sourceRecord, legacy)

    const target = new MemoryStorage()
    importCharacterTransfer(plan, target, { mode: 'add' })
    const restored = parseCharacterTransfer(exportStoredCharacters(target))
    assert.deepEqual(restored.npcs[0]?.sourceRecord, legacy)
    assert.equal(source.getItem(LEGACY_MONSTER_KEY), raw)
})

test('exports and imports current and historical source data without losing hidden fields', () => {
    const source = new MemoryStorage()
    const { key, raw } = storeHistorical(source, 'transfer-1')
    migrateCompatibleStorage(source)
    const text = exportStoredCharacters(source)
    const plan = parseCharacterTransfer(text)
    assert.deepEqual(plan.characters[0]?.sourceRecord, JSON.parse(raw))

    const target = new MemoryStorage()
    const imported = importCharacterTransfer(plan, target, { mode: 'add' })
    const restored = listCompatibleRecords(target).characters[0]!
    assert.equal(imported.importedCharacterIds.length, 1)
    assert.deepEqual(restored.sourceRecord, JSON.parse(raw))
    assert.equal(restored.character.extensions.unmappedLegacyField, undefined)
    assert.deepEqual(restored.sourceRecord, JSON.parse(target.getItem(`${CHARACTER_COLLECTION_PREFIX}${restored.id}`)!).sourceRecord)
    assert.notEqual(source.getItem(key), null)
})

test('import creates new IDs instead of overwriting an existing ID', () => {
    const storage = new MemoryStorage()
    const current = createEmptyCharacter()
    current.id = 'shared-id'
    saveCompatibleRecord(current, storage)
    const plan = parseCharacterTransfer(serializeCharacterTransfer([{
        id: 'shared-id', kind: 'character', character: { ...current, identity: { ...current.identity, name: 'Импортированный' } }, sourceKey: 'import', format: 'current',
    } as CompatibleRecord]))
    const result = importCharacterTransfer(plan, storage, { mode: 'add' })
    assert.equal(result.importedCharacterIds.length, 1)
    assert.equal(result.renamedIds.length, 1)
    assert.notEqual(result.importedCharacterIds[0], 'shared-id')
    assert.equal(listCompatibleRecords(storage).characters.length, 2)
})

test('replace import updates only the selected character while preserving its ID', () => {
    const storage = new MemoryStorage()
    const original = createEmptyCharacter()
    original.id = 'replace-target'
    original.identity.name = 'Текущий'
    saveCompatibleRecord(original, storage)
    const imported = createEmptyCharacter()
    imported.id = 'incoming-id'
    imported.identity.name = 'Импортированный'
    const plan = parseCharacterTransfer(serializeCharacterTransfer([{
        id: imported.id, kind: 'character', character: imported, sourceKey: 'test', format: 'current',
    } as CompatibleRecord]))
    const result = importCharacterTransfer(plan, storage, { mode: 'replace', activeCharacterId: original.id })
    assert.deepEqual(result.importedCharacterIds, ['replace-target'])
    assert.equal(listCompatibleRecords(storage).characters.length, 1)
    assert.equal(findCompatibleRecord('replace-target', 'character', storage)?.character.identity.name, 'Импортированный')
    assert.equal(findCompatibleRecord('incoming-id', 'character', storage), null)
})

test('rejects malformed imports before changing storage', () => {
    const storage = new MemoryStorage()
    const current = createEmptyCharacter()
    current.id = 'unchanged'
    saveCompatibleRecord(current, storage)
    const before = storage.getItem(`${CHARACTER_COLLECTION_PREFIX}unchanged`)
    assert.throws(() => parseCharacterTransfer('{oops'), /некорректный JSON/)
    assert.throws(() => parseCharacterTransfer(JSON.stringify({ characters: [{ id: 'bad', identity: {} }], exportVersion: 2, schemaVersion: 3 })), /не прошла проверку/)
    const invalidId = createEmptyCharacter()
    invalidId.id = 'contains/slash'
    assert.throws(() => parseCharacterTransfer(JSON.stringify(invalidId)), /недопустимый ID/)
    assert.equal(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}unchanged`), before)
})

test('restores hit dice according to the saved 2014 or 2024 ruleset', () => {
    const combat = createEmptyCharacter().combat
    combat.hitPoints = { max: 20, current: 1, temporary: 2 }
    combat.hitDice = { size: 'd10', total: 5, spent: 4 }
    combat.deathSaves = { successes: 2, failures: 1 }
    assert.deepEqual(takeLongRest(combat, '2014').hitDice, { size: 'd10', total: 5, spent: 2 })
    assert.deepEqual(takeLongRest(combat, '2024').hitDice, { size: 'd10', total: 5, spent: 0 })
    assert.equal(takeLongRest(combat, '2014').hitPoints.current, 20)
    assert.equal(takeLongRest(combat, '2014').hitPoints.temporary, 0)
})

test('restores the historical active pointer when it names a valid character', () => {
    const storage = new MemoryStorage()
    storeHistorical(storage, 'active-old')
    assert.equal(storage.getItem(HISTORICAL_CHARACTER_ACTIVE_KEY), 'active-old')
    migrateCompatibleStorage(storage)
    assert.equal(getActiveCompatibleCharacterId(storage), 'active-old')
})

test('adapts versioned v1 and v2 records without deleting their source keys', () => {
    for (const version of [1, 2] as const) {
        const storage = new MemoryStorage()
        const value = historicalCharacter(`v${version}`, version === 1 ? '2014' : '2024')
        value.schemaVersion = version
        const key = `${HISTORICAL_CHARACTER_PREFIX}v${version}:sheet-${version}`
        const raw = JSON.stringify(value)
        storage.setItem(key, raw)
        const result = migrateCompatibleStorage(storage)
        assert.equal(result.characters[0]?.character.ruleset, version === 1 ? '2014' : '2024')
        assert.equal(storage.getItem(key), raw)
        assert.ok(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}sheet-${version}`))
    }
})

test('uses the versioned source key when an old v1/v2 record has no embedded schemaVersion', () => {
    for (const version of [1, 2] as const) {
        const storage = new MemoryStorage()
        const value = historicalCharacter(`key-v${version}`, version === 1 ? '2014' : '2024')
        delete value.schemaVersion
        const key = `${HISTORICAL_CHARACTER_PREFIX}v${version}:keyed-${version}`
        const raw = JSON.stringify(value)
        storage.setItem(key, raw)

        const loaded = listCompatibleRecords(storage)
        assert.equal(loaded.characters[0]?.id, `keyed-${version}`)
        assert.equal(loaded.characters[0]?.format, `historical-v${version}`)
        assert.equal(loaded.characters[0]?.character.ruleset, version === 1 ? '2014' : '2024')
        const result = migrateCompatibleStorage(storage)
        assert.equal(result.characters[0]?.id, `keyed-${version}`)
        assert.equal(storage.getItem(key), raw)
        assert.ok(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}keyed-${version}`))
    }
})

test('saving an adapted character updates the canonical copy while retaining the untouched historical source for export', () => {
    const storage = new MemoryStorage()
    const { key, raw } = storeHistorical(storage, 'edit-legacy')
    migrateCompatibleStorage(storage)
    const record = findCompatibleRecord('edit-legacy', 'character', storage)
    assert.ok(record)
    record.character.identity.name = 'Изменённое имя'
    saveCompatibleRecord(record.character, storage, 'character')
    const current = findCompatibleRecord('edit-legacy', 'character', storage)
    assert.equal(current?.character.identity.name, 'Изменённое имя')
    assert.equal(storage.getItem(key), raw)
    const exported = parseCharacterTransfer(exportStoredCharacters(storage))
    assert.equal(exported.characters[0]?.character.identity.name, 'Изменённое имя')
    assert.deepEqual(exported.characters[0]?.sourceRecord, JSON.parse(raw))
})

test('rolls back a multi-record import if storage fails midway', () => {
    const storage = new MemoryStorage()
    const first = createEmptyCharacter()
    first.id = 'rollback-a'
    const second = createEmptyCharacter()
    second.id = 'rollback-b'
    const plan = parseCharacterTransfer(serializeCharacterTransfer([
        { id: 'rollback-a', kind: 'character', character: first, sourceKey: 'test', format: 'current' },
        { id: 'rollback-b', kind: 'character', character: second, sourceKey: 'test', format: 'current' },
    ]))
    storage.failKey = `${CHARACTER_COLLECTION_PREFIX}rollback-b`
    assert.throws(() => importCharacterTransfer(plan, storage, { mode: 'add' }), /откатаны/)
    assert.equal(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}rollback-a`), null)
    assert.equal(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}rollback-b`), null)
    assert.equal(storage.getItem(`${CHARACTER_COLLECTION_PREFIX}index`), null)
})

test('collection saves maintain a distinct active selection for multiple characters', () => {
    const storage = new MemoryStorage()
    const first = createEmptyCharacter()
    first.id = 'multi-a'
    first.identity.name = 'Первый'
    const second = createEmptyCharacter()
    second.id = 'multi-b'
    second.identity.name = 'Второй'
    saveCompatibleRecord(first, storage)
    saveCompatibleRecord(second, storage)
    setActiveCompatibleCharacterId(first.id, storage)
    assert.equal(getActiveCompatibleCharacterId(storage), 'multi-a')
    assert.equal(findCompatibleRecord('multi-b', 'character', storage)?.character.identity.name, 'Второй')
    assert.equal(listCompatibleRecords(storage).characters.length, 2)
})
