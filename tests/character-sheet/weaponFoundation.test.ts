import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_CLASSES, RULES_2024_WEAPON_MASTERIES, RULES_2024_WEAPONS, getRules2024Weapon, getRules2024WeaponMastery } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

test('publishes both weapon categories and the eight 2024 mastery definitions', () => {
  assert.equal(RULES_2024_WEAPON_MASTERIES.length, 8)
  assert.equal(new Set(RULES_2024_WEAPON_MASTERIES.map((item) => item.id)).size, 8)
  assert.ok(RULES_2024_WEAPONS.some((item) => item.category === 'melee'))
  assert.ok(RULES_2024_WEAPONS.some((item) => item.category === 'ranged'))
  assert.ok(RULES_2024_WEAPONS.every((item) => item.ruleset === '2024' && item.name && item.damage && item.damageType && Array.isArray(item.properties) && item.mastery && getRules2024WeaponMastery(item.mastery)))
  assert.equal(getRules2024Weapon('longsword')?.mastery, 'sap')
  assert.equal(getRules2024WeaponMastery('topple')?.name, 'Topple')
})

test('class metadata exposes weapon proficiencies without adding mastery choices', () => {
  assert.equal(RULES_2024_CLASSES.length, 12)
  assert.ok(RULES_2024_CLASSES.every((item) => Array.isArray(item.weaponProficiencies)))
})

test('known weapon and mastery links round-trip through attack and inventory', async () => {
  const storage = new MemoryStorage()
  const character = migrateCharacterV2ToV3(createMockCharacter())
  character.ruleset = '2024'
  character.attacks[0] = { ...character.attacks[0]!, weaponId: 'longsword', masteryId: 'sap' }
  character.inventory.items[0] = { ...character.inventory.items[0]!, weaponId: 'longsword' }
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`, JSON.stringify(character))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const view = await adapter.load(character.id)
  assert.equal(view.attacks[0]?.weaponId, 'longsword')
  assert.equal(view.attacks[0]?.masteryId, 'sap')
  assert.equal(view.inventoryData.items[0]?.weaponId, 'longsword')
  await adapter.save(view)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`)!) as CharacterV3
  assert.equal(saved.attacks[0]?.weaponId, 'longsword')
  assert.equal(saved.attacks[0]?.masteryId, 'sap')
  assert.equal(saved.inventory.items[0]?.weaponId, 'longsword')
  assert.deepEqual(validateCharacterV3(saved), [])
})

test('unknown weapon links are rejected while legacy free-text attacks remain valid', () => {
  const invalid = migrateCharacterV2ToV3(createMockCharacter())
  invalid.ruleset = '2024'
  invalid.attacks[0] = { ...invalid.attacks[0]!, weaponId: 'missing-weapon', masteryId: 'missing-mastery' }
  invalid.inventory.items[0] = { ...invalid.inventory.items[0]!, weaponId: 'missing-weapon' }
  assert.ok(validateCharacterV3(invalid).some((error) => error.includes('атаки')))
  assert.ok(validateCharacterV3(invalid).some((error) => error.includes('инвентарь')))

  const legacy = migrateCharacterV2ToV3(createMockCharacter())
  legacy.attacks[0] = { ...legacy.attacks[0]!, weaponMastery: 'Старое текстовое мастерство' }
  assert.deepEqual(validateCharacterV3(legacy), [])
})

test('old v3 characters without weapon links preserve attacks and inventory after reload', async () => {
  const storage = new MemoryStorage()
  const legacy = migrateCharacterV2ToV3(createMockCharacter())
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${legacy.id}`, JSON.stringify(legacy))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  const view = await adapter.load(legacy.id)
  await adapter.save(view)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${legacy.id}`)!) as CharacterV3

  assert.equal(saved.attacks[0]?.weaponId, undefined)
  assert.equal(saved.attacks[0]?.masteryId, undefined)
  assert.equal(saved.attacks[0]?.weaponMastery, legacy.attacks[0]?.weaponMastery)
  assert.equal(saved.attacks.length, legacy.attacks.length)
  assert.equal(saved.inventory.items.length, legacy.inventory.items.length)
  assert.deepEqual(validateCharacterV3(saved), [])
})
