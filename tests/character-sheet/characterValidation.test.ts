import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { assertValidCharacterV1, validateCharacter, withCharacterDefaults } from '../../src/modules/character-sheet/validation/characterValidation.ts'
import { migrateCharacterV1 } from '../../src/modules/character-sheet/migration/characterMigration.ts'
import { abilityModifier, signedModifier } from '../../src/modules/character-sheet/domain/abilityModifier.ts'
import { formatAttackBonus } from '../../src/modules/character-sheet/domain/attackBonus.ts'

test('mock character satisfies schema v2', () => {
  assert.deepEqual(validateCharacter(createMockCharacter()), [])
})

test('validation rejects an empty name and negative money', () => {
  const character = createMockCharacter()
  character.name = ' '
  character.money.gold = -1
  assert.ok(validateCharacter(character).length > 0)
})

test('legacy character receives defaults for new fields without changing existing data', () => {
  const character = createMockCharacter()
  const { class: _class, level: _level, experience: _experience, armorClass: _armorClass, ...legacyCharacter } = character
  const legacy = {
    ...legacyCharacter,
    schemaVersion: 1,
    skills: character.skills.map(({ id, name, value }) => ({ id, name, value })),
    attacks: character.attacks.map(({ id, name, attackBonus, damage, description }) => ({ id, name, attackBonus, damage, description })),
  }
  const migrated = withCharacterDefaults(legacy) as Record<string, unknown>
  assert.equal(migrated.name, character.name)
  assert.equal(migrated.class, '')
  assert.equal(migrated.level, 1)
  assert.equal(migrated.experience, 0)
  assert.equal(migrated.armorClass, 10)
  assert.doesNotThrow(() => assertValidCharacterV1(migrated))
  const v2 = migrateCharacterV1(migrated)
  assert.equal(v2.schemaVersion, 2)
  assert.equal(v2.skills[0]?.ability, 'dexterity')
  assert.equal(v2.skills[0]?.proficiency, 'none')
  assert.equal(v2.attacks[0]?.bonusSource, 'manual')
  assert.equal(v2.attacks[0]?.additionalBonus, 0)
  assert.deepEqual(validateCharacter(v2), [])
})

test('ability modifier follows the D&D floor rule', () => {
  assert.equal(abilityModifier(10), 0)
  assert.equal(abilityModifier(9), -1)
  assert.equal(abilityModifier(15), 2)
  assert.equal(signedModifier(-1), '-1')
  assert.equal(signedModifier(2), '+2')
})

test('legacy and source-based attack bonuses remain compatible', () => {
  const character = createMockCharacter()
  assert.deepEqual(validateCharacter(character), [])
  assert.equal(formatAttackBonus(character.attacks[0]!, character.abilities), '+4')

  const sourceBasedAttack = {
    ...character.attacks[0]!,
    bonusSource: 'strength' as const,
    additionalBonus: 2,
  }
  character.attacks = [sourceBasedAttack]
  assert.deepEqual(validateCharacter(character), [])
  assert.equal(formatAttackBonus(sourceBasedAttack, character.abilities), '+2')
})

test('attack validation rejects an unknown source and fractional extra bonus', () => {
  const character = createMockCharacter()
  character.attacks = [{ ...character.attacks[0]!, bonusSource: 'luck' as never, additionalBonus: 1.5 }]
  assert.ok(validateCharacter(character).includes('Некорректная атака.'))
})
