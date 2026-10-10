import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { getRules2024CantripsForClass, getRules2024Class, getRules2024Spell, getRules2024SpellsForClass, RULES_2024_SPELLS } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateV3To2024 } from '../../src/modules/character-sheet/migration/v3To2024.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

test('publishes tagged cantrips and leveled spells with catalog metadata', () => {
  assert.ok(RULES_2024_SPELLS.some((spell) => spell.level === 0))
  assert.ok(RULES_2024_SPELLS.some((spell) => spell.level === 1))
  assert.ok(RULES_2024_SPELLS.some((spell) => spell.level >= 2 && spell.level <= 9))
  assert.ok(RULES_2024_SPELLS.every((spell) => spell.ruleset === '2024' && spell.name && spell.school && spell.classes.length > 0 && spell.metadata))
  assert.equal(getRules2024Spell('fire-bolt')?.level, 0)
  assert.equal(getRules2024Spell('magic-missile')?.school, 'Воплощение')
})

test('relates catalog spells to class spellcasting metadata', () => {
  const wizard = getRules2024Class('wizard')
  assert.equal(wizard?.spellcastingAbility, 'intelligence')
  assert.equal(wizard?.spellProgressionType, 'prepared')
  assert.ok(getRules2024SpellsForClass('wizard').some((spell) => spell.id === 'magic-missile'))
  assert.ok(getRules2024CantripsForClass('wizard').every((spell) => spell.level === 0))
})

test('hydrates spellIds, preserves custom embedded spells and round-trips canonical links', async () => {
  const storage = new MemoryStorage()
  const character = migrateCharacterV2ToV3(createMockCharacter())
  character.ruleset = '2024'
  character.spellcasting.spellRuleset = '2024'
  character.spellcasting.spellIds = ['magic-missile']
  character.spellcasting.cantripIds = ['fire-bolt']
  character.spellcasting.knownSpells = [{ ...character.spellcasting.knownSpells[0]!, id: 'custom-spell', name: 'Авторское заклинание' }]
  character.spellcasting.cantrips = []
  character.spellcasting.preparedSpellIds = ['magic-missile']
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`, JSON.stringify(character))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const view = await adapter.load(character.id)
  assert.ok(view.spells.some((spell) => spell.id === 'magic-missile' && spell.school === 'Воплощение'))
  assert.ok(view.spells.some((spell) => spell.id === 'custom-spell'))
  assert.ok(view.cantrips.some((spell) => spell.id === 'fire-bolt' && spell.classes?.includes('wizard')))
  assert.deepEqual(view.spellcasting.preparedSpellIds, ['magic-missile'])

  await adapter.save(view)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${character.id}`)!) as CharacterV3
  assert.deepEqual(saved.spellcasting.spellIds, ['custom-spell', 'magic-missile'].filter((id) => id === 'magic-missile'))
  assert.deepEqual(saved.spellcasting.cantripIds, ['fire-bolt'])
  assert.ok(saved.spellcasting.knownSpells.some((spell) => spell.id === 'custom-spell'))
  assert.deepEqual(validateCharacterV3(saved), [])
})

test('rejects unknown modern spell references while accepting old embedded spell records', () => {
  const invalid = migrateCharacterV2ToV3(createMockCharacter())
  invalid.ruleset = '2024'
  invalid.spellcasting.spellRuleset = '2024'
  invalid.spellcasting.spellIds = ['missing-spell']
  assert.ok(validateCharacterV3(invalid).some((error) => error.includes('магии')))

  const legacy = migrateCharacterV2ToV3(createMockCharacter())
  legacy.spellcasting.knownSpells[0] = { ...legacy.spellcasting.knownSpells[0]!, id: 'spell-legacy', name: 'Старое заклинание' }
  assert.deepEqual(validateCharacterV3(legacy), [])
})

test('promotes canonical spell ids without losing old character data', () => {
  const legacy = migrateCharacterV2ToV3(createMockCharacter())
  legacy.spellcasting.knownSpells = [{ ...legacy.spellcasting.knownSpells[0]!, id: 'fire-bolt' }]
  legacy.spellcasting.cantrips = []
  const promoted = migrateV3To2024(legacy)
  assert.deepEqual(promoted.spellcasting.spellIds, ['fire-bolt'])
  assert.deepEqual(promoted.spellcasting.cantripIds, [])
  assert.equal(promoted.attacks.length, legacy.attacks.length)
  assert.equal(promoted.inventory.items.length, legacy.inventory.items.length)
  assert.deepEqual(validateCharacterV3(promoted), [])
})
