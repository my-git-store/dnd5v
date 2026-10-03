import test from 'node:test'
import assert from 'node:assert/strict'
import { abilityModifier, nullableAbilityModifier } from '../../src/modules/character-sheet/domain/abilityModifier.ts'
import { calculateAttackBonus, formatAttackBonus } from '../../src/modules/character-sheet/domain/attackBonus.ts'
import { proficiencyBonus } from '../../src/modules/character-sheet/domain/proficiencyBonus.ts'
import { calculateSavingThrowBonus } from '../../src/modules/character-sheet/domain/savingThrow.ts'
import { calculateSkillBonus } from '../../src/modules/character-sheet/domain/skillBonus.ts'
import { calculateSpellAttackBonus, calculateSpellSaveDc } from '../../src/modules/character-sheet/domain/spellcasting.ts'
import type { CharacterAbilities } from '../../src/modules/character-sheet/types/character.ts'

const abilities: CharacterAbilities = {
  strength: 16,
  dexterity: 14,
  constitution: 12,
  intelligence: 10,
  wisdom: 8,
  charisma: 18,
}

test('ability modifiers follow floor rule and handle missing data', () => {
  assert.equal(abilityModifier(1), -5)
  assert.equal(abilityModifier(9), -1)
  assert.equal(abilityModifier(18), 4)
  assert.equal(nullableAbilityModifier(undefined), null)
  assert.equal(nullableAbilityModifier(Number.NaN), null)
})

test('proficiency bonus follows the PHB level bands', () => {
  assert.equal(proficiencyBonus(1), 2)
  assert.equal(proficiencyBonus(4), 2)
  assert.equal(proficiencyBonus(5), 3)
  assert.equal(proficiencyBonus(9), 4)
  assert.equal(proficiencyBonus(13), 5)
  assert.equal(proficiencyBonus(17), 6)
  assert.equal(proficiencyBonus(21), null)
})

test('skill bonus preserves legacy manual value and computes proficiency modes', () => {
  const legacySkill = { ability: 'strength' as const, proficiency: 'none' as const, value: 7 }
  assert.equal(calculateSkillBonus(legacySkill, abilities, 1), 7)
  assert.equal(calculateSkillBonus({ ...legacySkill, calculationMode: 'computed' }, abilities, 1), 3)
  assert.equal(calculateSkillBonus({ ...legacySkill, proficiency: 'proficient', calculationMode: 'computed' }, abilities, 5), 6)
  assert.equal(calculateSkillBonus({ ...legacySkill, proficiency: 'expertise', calculationMode: 'computed' }, abilities, 5), 9)
  assert.equal(calculateSkillBonus({ ...legacySkill, ability: null, calculationMode: 'computed' }, abilities, 1), null)
})

test('saving throw bonus adds proficiency only when enabled', () => {
  assert.equal(calculateSavingThrowBonus({ ability: 'dexterity', proficient: false }, abilities, 1), 2)
  assert.equal(calculateSavingThrowBonus({ ability: 'dexterity', proficient: true, additionalBonus: 1 }, abilities, 5), 6)
  assert.equal(calculateSavingThrowBonus({ ability: null, proficient: true }, abilities, 1), null)
  assert.equal(calculateSavingThrowBonus({ ability: 'dexterity', proficient: true }, abilities, 21), null)
})

test('attack bonus supports legacy manual and computed modes', () => {
  const manualAttack = { attackBonus: '+4', bonusSource: 'manual' as const, additionalBonus: 0 }
  assert.equal(calculateAttackBonus(manualAttack, abilities, 1), null)
  assert.equal(formatAttackBonus(manualAttack, abilities), '+4')

  const computedAttack = { attackBonus: '+0', bonusSource: 'strength' as const, additionalBonus: 1, proficient: true }
  assert.equal(calculateAttackBonus(computedAttack, abilities, 5), 7)
  assert.equal(formatAttackBonus(computedAttack, abilities, 5), '+7')
  assert.equal(calculateAttackBonus({ ...computedAttack, abilitySource: null, calculationMode: 'computed' }, abilities, 5), null)
})

test('spell save DC and attack bonus are unavailable without configured ability', () => {
  assert.equal(calculateSpellSaveDc('charisma', abilities, 5), 15)
  assert.equal(calculateSpellAttackBonus('charisma', abilities, 5), 7)
  assert.equal(calculateSpellSaveDc(null, abilities, 5), null)
  assert.equal(calculateSpellAttackBonus('charisma', abilities, 0), null)
})
