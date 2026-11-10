import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/api/characterSheetAdapter.ts'
import { CHARACTER_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/api/characterStorage.ts'
import { getRules2024CantripsForClass, getRules2024Class, getRules2024Spell, getRules2024SpellsForClass, RULES_2024_SPELLS } from '../../src/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/data/character.mock.ts'
import { promoteCharacterTo2024 } from '../../src/domain/ruleset.ts'
import type { Character } from '../../src/types/character.ts'
import { validateCharacter } from '../../src/validation/characterValidation.ts'

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

test('preserves embedded current spells and round-trips canonical links', async () => {
  const storage = new MemoryStorage()

  const character = createMockCharacter()
  character.ruleset = '2024'
  character.spellcasting.spellRuleset = '2024'
  character.spellcasting.spellIds = ['magic-missile']
  character.spellcasting.cantripIds = ['fire-bolt']
  character.spellcasting.knownSpells = [{ ...character.spellcasting.knownSpells[0]!, id: 'custom-spell', name: 'Авторское заклинание' }]
  character.spellcasting.cantrips = []
  character.spellcasting.preparedSpellIds = ['magic-missile']
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${character.id}`, JSON.stringify(character))
  const adapter = createCharacterSheetAdapter({ storage })

  const view = await adapter.load(character.id)
  assert.ok(view.spells.some((spell) => spell.id === 'custom-spell'))
  assert.equal(view.spells.some((spell) => spell.id === 'magic-missile'), false)
  assert.deepEqual(view.cantrips, [])
  assert.deepEqual(view.spellcasting.preparedSpellIds, ['magic-missile'])

  await adapter.save(view)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${character.id}`)!) as Character
  assert.deepEqual(saved.spellcasting.spellIds, [])
  assert.deepEqual(saved.spellcasting.cantripIds, [])
  assert.ok(saved.spellcasting.knownSpells.some((spell) => spell.id === 'custom-spell'))
  assert.deepEqual(validateCharacter(saved), [])
})

test('rejects unknown modern spell references while accepting old embedded spell records', () => {
  const invalid = createMockCharacter()
  invalid.ruleset = '2024'
  invalid.spellcasting.spellRuleset = '2024'
  invalid.spellcasting.spellIds = ['missing-spell']
  assert.ok(validateCharacter(invalid).some((error) => error.includes('магии')))

  const legacy = createMockCharacter()
  legacy.spellcasting.knownSpells[0] = { ...legacy.spellcasting.knownSpells[0]!, id: 'spell-legacy', name: 'Старое заклинание' }
  assert.deepEqual(validateCharacter(legacy), [])
})

test('promotes canonical spell ids without losing old character data', () => {
  const legacy = createMockCharacter()
  legacy.spellcasting.knownSpells = [{ ...legacy.spellcasting.knownSpells[0]!, id: 'fire-bolt' }]
  legacy.spellcasting.cantrips = []
  const promoted = promoteCharacterTo2024(legacy)
  assert.deepEqual(promoted.spellcasting.spellIds, ['fire-bolt'])
  assert.deepEqual(promoted.spellcasting.cantripIds, [])
  assert.equal(promoted.attacks.length, legacy.attacks.length)
  assert.equal(promoted.inventory.items.length, legacy.inventory.items.length)
  assert.deepEqual(validateCharacter(promoted), [])
})
