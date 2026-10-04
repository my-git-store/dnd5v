import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { readStoredCharacterV3, writeStoredCharacterV3, CHARACTER_V1_STORAGE_PREFIX, CHARACTER_V2_STORAGE_PREFIX, CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

function createLegacyV1() {
  const character = createMockCharacter()
  return {
    ...character,
    schemaVersion: 1 as const,
    skills: character.skills.map(({ id, name, value }) => ({ id, name, value })),
    attacks: character.attacks.map(({ id, name, attackBonus, damage, description }) => ({ id, name, attackBonus, damage, description })),
  }
}

test('migrates a v2 character into a valid v3 envelope', () => {
  const source = createMockCharacter()
  const migrated = migrateCharacterToV3(source)

  assert.equal(migrated.schemaVersion, 3)
  assert.equal(migrated.identity.name, source.name)
  assert.equal(migrated.identity.class, source.class)
  assert.equal(migrated.identity.level, source.level)
  assert.deepEqual(migrated.abilities, source.abilities)
  assert.equal(migrated.combat.armorClass.mode, 'manual')
  assert.equal(migrated.combat.armorClass.value, source.armorClass)
  assert.equal(migrated.skills[0]?.value, source.skills[0]?.value)
  assert.equal(migrated.skills[0]?.calculationMode, 'computed')
  assert.equal(migrated.attacks[0]?.attackBonus, source.attacks[0]?.attackBonus)
  assert.equal(migrated.attacks[0]?.abilitySource, source.attacks[0]?.bonusSource)
  assert.equal(migrated.spellcasting.knownSpells[0]?.name, source.spells[0]?.name)
  assert.equal(migrated.inventory.items[0]?.quantity, source.inventory[0]?.quantity)
  assert.equal(migrated.inventory.money.gold, source.money.gold)
  assert.equal(validateCharacterV3(migrated).length, 0)
})

test('reads v1 through the existing v1 to v2 migration before creating v3', () => {
  const source = createLegacyV1()
  const migrated = migrateCharacterToV3(source)

  assert.equal(migrated.schemaVersion, 3)
  assert.equal(migrated.identity.class, source.class)
  assert.equal(migrated.skills[0]?.ability, 'dexterity')
  assert.equal(migrated.skills[0]?.proficiency, 'none')
  assert.equal(migrated.attacks[0]?.abilitySource, 'manual')
  assert.equal(migrated.attacks[0]?.additionalBonus, 0)
  assert.equal(validateCharacterV3(migrated).length, 0)
})

test('migration is idempotent and returns an independent v3 copy', () => {
  const first = migrateCharacterToV3(createMockCharacter())
  const second = migrateCharacterToV3(first)

  assert.deepEqual(second, first)
  assert.notStrictEqual(second, first)
  second.identity.name = 'Изменённая копия'
  second.skills[0]!.value = 99
  assert.notEqual(first.identity.name, second.identity.name)
  assert.notEqual(first.skills[0]!.value, second.skills[0]!.value)
})

test('rejects corrupted v1, v2 and v3 data instead of replacing it with defaults', () => {
  const corruptedV2 = createMockCharacter()
  corruptedV2.name = ''
  assert.throws(() => migrateCharacterToV3(corruptedV2))
  assert.throws(() => migrateCharacterToV3({ schemaVersion: 3 }))
  assert.throws(() => migrateCharacterToV3({ schemaVersion: 1, id: 'broken' }))
})

test('preserves known and unknown data during v2 migration', () => {
  const source = createMockCharacter()
  source.skills[0]!.value = -2
  source.attacks[0]!.attackBonus = '1d20+5'
  source.spells[0]!.description = 'Сохранённое описание'
  source.inventory[0]!.quantity = 4
  source.money.gold = 99
  const sourceWithExtensions = {
    ...source,
    legacyNote: { origin: 'old-sheet' },
    attacks: [{ ...source.attacks[0]!, customMeta: { critical: 'двойной' } }],
  }

  const migrated = migrateCharacterToV3(sourceWithExtensions)
  const attack = migrated.attacks[0] as unknown as Record<string, unknown>
  assert.deepEqual(migrated.extensions.legacyNote, { origin: 'old-sheet' })
  assert.deepEqual(attack.customMeta, { critical: 'двойной' })
  assert.equal(migrated.skills[0]?.value, -2)
  assert.equal(migrated.attacks[0]?.attackBonus, '1d20+5')
  assert.equal(migrated.spellcasting.knownSpells[0]?.description, 'Сохранённое описание')
  assert.equal(migrated.inventory.items[0]?.quantity, 4)
  assert.equal(migrated.inventory.money.gold, 99)
})

test('reads v1/v2 keys, writes only v3, and never removes old keys', () => {
  const storage = new MemoryStorage()
  const source = createLegacyV1()
  const v1Key = `${CHARACTER_V1_STORAGE_PREFIX}${source.id}`
  const v2Key = `${CHARACTER_V2_STORAGE_PREFIX}${source.id}`
  const v3Key = `${CHARACTER_V3_STORAGE_PREFIX}${source.id}`
  storage.setItem(v1Key, JSON.stringify(source))

  const migrated = readStoredCharacterV3(source.id, storage)
  assert.equal(migrated?.schemaVersion, 3)
  assert.notEqual(storage.getItem(v1Key), null)
  assert.equal(storage.getItem(v2Key), null)
  assert.equal(storage.getItem(v3Key), null)

  const v2Storage = new MemoryStorage()
  v2Storage.setItem(v2Key, JSON.stringify(createMockCharacter()))
  assert.equal(readStoredCharacterV3(source.id, v2Storage)?.schemaVersion, 3)
  assert.notEqual(v2Storage.getItem(v2Key), null)

  writeStoredCharacterV3(migrated!, storage)
  assert.notEqual(storage.getItem(v1Key), null)
  assert.notEqual(storage.getItem(v3Key), null)
  assert.equal(readStoredCharacterV3(source.id, storage)?.schemaVersion, 3)
})
