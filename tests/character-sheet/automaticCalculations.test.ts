import test from 'node:test'
import assert from 'node:assert/strict'
import { abilityModifier, signedModifier } from '../../src/modules/character-sheet/domain/abilityModifier.ts'
import { calculateAttackBonus, calculateAttackDamageModifier } from '../../src/modules/character-sheet/domain/attackBonus.ts'
import { calculateInitiative } from '../../src/modules/character-sheet/domain/combatCalculations.ts'
import { calculateSavingThrowBonus } from '../../src/modules/character-sheet/domain/savingThrow.ts'
import { calculateSkillBonus } from '../../src/modules/character-sheet/domain/skillBonus.ts'
import { calculateSpellAttackBonus, calculateSpellSaveDc } from '../../src/modules/character-sheet/domain/spellcasting.ts'
import { proficiencyBonus } from '../../src/modules/character-sheet/domain/proficiencyBonus.ts'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'

const abilities = { strength: 16, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 8, charisma: 18 }

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

test('formats positive, zero and negative ability modifiers with a sign', () => {
  assert.equal(abilityModifier(18), 4)
  assert.equal(abilityModifier(10), 0)
  assert.equal(abilityModifier(9), -1)
  assert.equal(signedModifier(4), '+4')
  assert.equal(signedModifier(0), '+0')
  assert.equal(signedModifier(-1), '-1')
})

test('updates dependent skill, save, initiative and attack values from current inputs', () => {
  const skill = { ability: 'dexterity' as const, proficiency: 'proficient' as const, value: 0, calculationMode: 'computed' as const, additionalBonus: 1 }
  assert.equal(calculateSkillBonus(skill, abilities, 5), 6)
  assert.equal(calculateSkillBonus(skill, { ...abilities, dexterity: 18 }, 5), 8)
  assert.equal(calculateSavingThrowBonus({ ability: 'dexterity', proficient: true, additionalBonus: 1 }, abilities, 5), 6)
  assert.equal(calculateInitiative(abilities, 2), 4)
  const attack = { attackBonus: '', bonusSource: 'strength' as const, proficient: true, calculationMode: 'computed' as const, additionalBonus: 1 }
  assert.equal(calculateAttackBonus(attack, abilities, 5), 7)
  assert.equal(calculateAttackDamageModifier(attack, abilities), 3)
})

test('manual values remain authoritative while computed spell values follow level and ability', () => {
  assert.equal(proficiencyBonus(1), 2)
  assert.equal(proficiencyBonus(5), 3)
  assert.equal(proficiencyBonus(9), 4)
  assert.equal(proficiencyBonus(13), 5)
  assert.equal(proficiencyBonus(17), 6)
  const manualAttack = { attackBonus: '+9', bonusSource: 'manual' as const, calculationMode: 'manual' as const, additionalBonus: 0 }
  assert.equal(calculateAttackBonus(manualAttack, abilities, 17), null)
  assert.equal(calculateAttackDamageModifier(manualAttack, abilities), null)
  assert.equal(calculateSkillBonus({ ability: 'strength', proficiency: 'none', value: 9, calculationMode: 'manual', additionalBonus: 99 }, abilities, 17), 9)
  assert.equal(calculateSpellSaveDc('charisma', abilities, 5), 15)
  assert.equal(calculateSpellAttackBonus('charisma', abilities, 5), 7)
})

test('calculation inputs survive adapter save and recompute after reload', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => source })
  const draft = await adapter.load(source.id)
  const skill = draft.skills[0]!
  draft.abilities.strength = 18
  skill.ability = 'strength'
  skill.proficiency = 'proficient'
  skill.calculationMode = 'computed'
  skill.additionalBonus = 1
  await adapter.save(draft)
  assert.ok(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`))
  const reloaded = await adapter.load(source.id)
  assert.equal(calculateSkillBonus(reloaded.skills[0]!, reloaded.abilities, reloaded.level), 7)
  assert.equal(reloaded.abilities.strength, 18)
  assert.equal(reloaded.skills[0]?.additionalBonus, 1)
})
