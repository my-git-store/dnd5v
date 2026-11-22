import assert from 'node:assert/strict'
import test from 'node:test'

import {
    CHARACTER_STORAGE_KEY,
    hasIncompatibleStoredCharacter,
    LEGACY_CHARACTER_STORAGE_PREFIX,
    readStoredCharacter,
    writeStoredCharacter,
    type CharacterStorageLike,
} from '../src/api/characterStorage.ts'
import { createEmptyCharacter } from '../src/data/character.mock.ts'

class MemoryStorage implements CharacterStorageLike {
    private readonly values = new Map<string, string>()

    get length() {
        return this.values.size
    }

    getItem(key: string) {
        return this.values.get(key) ?? null
    }

    setItem(key: string, value: string) {
        this.values.set(key, value)
    }

    key(index: number) {
        return [...this.values.keys()][index] ?? null
    }
}

test('reads and restores a valid current character record', () => {
    const storage = new MemoryStorage()
    const character = createEmptyCharacter()
    character.identity.class = 'Воин'
    writeStoredCharacter(character, storage)

    assert.deepEqual(readStoredCharacter(storage), character)
    assert.equal(
        JSON.parse(storage.getItem(CHARACTER_STORAGE_KEY) ?? 'null').identity.class,
        'Воин',
    )
})

test('does not load or overwrite an older NPC record without preserving it', () => {
    const storage = new MemoryStorage()
    const oldNpc = JSON.stringify({
        schemaVersion: 3,
        kind: 'npc',
        identity: { name: 'Старый страж' },
    })
    storage.setItem(CHARACTER_STORAGE_KEY, oldNpc)

    assert.equal(readStoredCharacter(storage), null)
    assert.equal(hasIncompatibleStoredCharacter(storage), true)

    writeStoredCharacter(createEmptyCharacter(), storage)

    assert.equal(storage.getItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}1`), oldNpc)
    assert.equal(JSON.parse(storage.getItem(CHARACTER_STORAGE_KEY) ?? 'null').identity.class, '')
})

test('preserves the previous saved character when creating a replacement', () => {
    const storage = new MemoryStorage()
    const previous = createEmptyCharacter()
    previous.identity.class = 'Следопыт'
    writeStoredCharacter(previous, storage)
    const previousRaw = storage.getItem(CHARACTER_STORAGE_KEY)

    writeStoredCharacter(createEmptyCharacter(), storage, true)

    assert.equal(storage.getItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}1`), previousRaw)
    assert.equal(JSON.parse(storage.getItem(CHARACTER_STORAGE_KEY) ?? 'null').identity.class, '')
})

test('preserves malformed records and all older versioned character keys', () => {
    const storage = new MemoryStorage()
    const malformed = '{not json'
    storage.setItem(CHARACTER_STORAGE_KEY, malformed)
    storage.setItem('nastolka:character-sheet:v3:legacy-id', JSON.stringify({ kind: 'npc' }))

    assert.equal(readStoredCharacter(storage), null)
    assert.equal(hasIncompatibleStoredCharacter(storage), true)

    writeStoredCharacter(createEmptyCharacter(), storage)

    assert.equal(storage.getItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}1`), malformed)
    assert.notEqual(storage.getItem('nastolka:character-sheet:v3:legacy-id'), null)
})

test('uses a new archive key instead of replacing an existing preserved record', () => {
    const storage = new MemoryStorage()
    const firstArchive = '{first preserved record}'
    const oldRecord = '{second legacy record}'
    storage.setItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}1`, firstArchive)
    storage.setItem(CHARACTER_STORAGE_KEY, oldRecord)

    writeStoredCharacter(createEmptyCharacter(), storage)

    assert.equal(storage.getItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}1`), firstArchive)
    assert.equal(storage.getItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}2`), oldRecord)
})

test('safely migrates legacy attack damage and inventory properties while retaining the source record', () => {
    const storage = new MemoryStorage()
    const legacyCharacter = JSON.parse(JSON.stringify(createEmptyCharacter())) as Record<
        string,
        unknown
    >
    delete legacyCharacter.feats
    delete legacyCharacter.extensions
    legacyCharacter.attacks = [
        {
            name: 'Меч',
            kind: 'melee',
            damage: '1d8',
            damageType: 'рубящий',
            proficient: true,
            ability: 'strength',
            additionalBonus: 2,
            range: 5,
            description: '',
        },
    ]
    const legacyItem = {
        name: 'Верёвка',
        quantity: 1,
        weight: 5,
        description: '',
        equipped: false,
        properties: ['длинная', 'прочная'],
    }
    const inventory = legacyCharacter.inventory as Record<string, unknown>
    inventory.items = [legacyItem]
    const raw = JSON.stringify(legacyCharacter)
    storage.setItem(CHARACTER_STORAGE_KEY, raw)

    const migrated = readStoredCharacter(storage)

    assert.ok(migrated)
    assert.deepEqual(migrated.attacks[0]?.damages[0], {
        damage: '1d8',
        damageType: 'рубящий',
        additionalDamage: 2,
        ability: 'strength',
        proficient: true,
    })
    assert.equal(migrated.inventory.items[0]?.properties, 'длинная, прочная')
    assert.deepEqual(migrated.feats, [])
    assert.deepEqual(migrated.extensions, {})
    assert.equal(storage.getItem(`${LEGACY_CHARACTER_STORAGE_PREFIX}1`), raw)
})
