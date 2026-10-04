import test from 'node:test'
import assert from 'node:assert/strict'
import { RULES_2024_BACKGROUNDS, RULES_2024_CLASSES, RULES_2024_FEATS, RULES_2024_SPECIES } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateV3To2024 } from '../../src/modules/character-sheet/migration/v3To2024.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

test('ships the PHB 2024 selection catalog with the expected core counts', () => {
  assert.equal(RULES_2024_SPECIES.length, 10)
  assert.equal(RULES_2024_BACKGROUNDS.length, 16)
  assert.equal(RULES_2024_CLASSES.length, 12)
  assert.ok(RULES_2024_FEATS.length >= 10)
  assert.ok(RULES_2024_BACKGROUNDS.every((background) => background.abilityOptions.length === 3 && background.skillProficiencies.length === 2 && background.originFeatId))
})

test('promotes v3 2014 to 2024 without losing legacy data', () => {
  const legacy = migrateCharacterV2ToV3(createMockCharacter())
  legacy.attacks[0]!.attackBonus = '1d20+5'
  legacy.spellcasting.knownSpells[0]!.description = 'Оставить'
  legacy.inventory.items[0]!.quantity = 3
  legacy.personality.biography = 'Старая история'

  const promoted = migrateV3To2024(legacy)

  assert.equal(promoted.ruleset, '2024')
  assert.equal(promoted.origin.species, legacy.identity.race.name)
  assert.equal(promoted.attacks[0]?.attackBonus, '1d20+5')
  assert.equal(promoted.spellcasting.knownSpells[0]?.description, 'Оставить')
  assert.equal(promoted.inventory.items[0]?.quantity, 3)
  assert.equal(promoted.personality.biography, 'Старая история')
  assert.equal(validateCharacterV3(promoted).length, 0)
  assert.notStrictEqual(promoted, legacy)
})

test('2024 creation uses background abilities and retains character collections', () => {
  const base = migrateCharacterV2ToV3(createMockCharacter())
  const view = {
    ...base,
    schemaVersion: 2 as const,
    name: base.identity.name,
    class: base.identity.class,
    level: base.identity.level,
    experience: base.identity.experience,
    armorClass: base.combat.armorClass.value,
    abilities: { ...base.abilities },
    skills: base.skills,
    attacks: base.attacks,
    spells: base.spellcasting.knownSpells,
    cantrips: base.spellcasting.cantrips,
    inventory: base.inventory.items.map(({ id, name, quantity, description }) => ({ id, name, quantity, description })),
    money: base.inventory.money,
    bio: { biography: base.personality.biography, traits: base.personality.traits, features: base.personality.features },
    race: base.identity.race,
    subclass: base.identity.subclass,
    background: base.identity.background,
    alignment: base.identity.alignment,
    savingThrows: base.savingThrows,
    proficiency: base.proficiency,
    combat: base.combat,
    spellcasting: base.spellcasting,
    inventoryData: base.inventory,
    personality: base.personality,
    origin: base.origin,
    ruleset: base.ruleset,
  }
  const spellsBefore = view.spells.length
  const next = applyCharacterCreation(view, {
    ruleset: '2024', speciesId: 'elf', raceId: 'elf', classId: 'wizard', backgroundId: 'sage-2024',
    originFeatId: 'magic-initiate-wizard', originAbilityChoices: ['intelligence', 'wisdom', 'constitution'], originAbilityFocus: 'intelligence',
    name: 'Архивариус', subclass: '', alignment: '', baseAbilities: { strength: 10, dexterity: 12, constitution: 13, intelligence: 14, wisdom: 11, charisma: 8 },
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  })
  assert.equal(next.ruleset, '2024')
  assert.equal(next.origin.species, 'Эльф')
  assert.equal(next.origin.originFeat, 'Посвящённый в магию: волшебник')
  assert.equal(next.abilities.intelligence, 16)
  assert.equal(next.abilities.wisdom, 12)
  assert.equal(next.creation?.abilityBonusSources?.intelligence?.[0]?.source, 'background')
  assert.equal(next.creation?.abilityBonusSources?.intelligence?.[0]?.amount, 2)
  assert.equal(next.spells.length, spellsBefore)
  assert.equal(next.attacks.length, view.attacks.length)
  assert.equal(next.inventoryData.items.some((item) => item.source === 'creation'), true)
  assert.equal(next.skills.find((skill) => skill.id === 'arcana')?.proficiencySources?.includes('class'), true)
  assert.equal(next.skills.find((skill) => skill.id === 'arcana')?.proficiencySources?.includes('background'), true)
})

test('2024 starting gold is money and repeated creation does not duplicate it', () => {
  const base = migrateCharacterV2ToV3(createMockCharacter())
  const view = {
    ...base,
    schemaVersion: 2 as const,
    name: base.identity.name,
    class: base.identity.class,
    level: base.identity.level,
    experience: base.identity.experience,
    armorClass: base.combat.armorClass.value,
    abilities: { ...base.abilities },
    skills: base.skills,
    attacks: base.attacks,
    spells: base.spellcasting.knownSpells,
    cantrips: base.spellcasting.cantrips,
    inventory: base.inventory.items.map(({ id, name, quantity, description }) => ({ id, name, quantity, description })),
    money: base.inventory.money,
    bio: { biography: base.personality.biography, traits: base.personality.traits, features: base.personality.features },
    race: base.identity.race,
    subclass: base.identity.subclass,
    background: base.identity.background,
    alignment: base.identity.alignment,
    savingThrows: base.savingThrows,
    proficiency: base.proficiency,
    combat: base.combat,
    spellcasting: base.spellcasting,
    inventoryData: base.inventory,
    personality: base.personality,
    origin: base.origin,
    ruleset: base.ruleset,
  }
  const payload = {
    ruleset: '2024' as const, speciesId: 'human', raceId: 'human', classId: 'wizard', backgroundId: 'sage-2024',
    classEquipmentId: 'wizard-gold', backgroundEquipmentId: 'sage-kit-2024-gold', originAbilityChoices: ['intelligence', 'wisdom', 'constitution'] as const, originAbilityFocus: 'intelligence' as const,
    name: 'Архивариус', subclass: '', alignment: '', baseAbilities: { ...base.abilities }, classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  }
  const first = applyCharacterCreation(view, payload)
  const repeated = applyCharacterCreation(first, payload)
  assert.equal(first.inventoryData.money.gold, 137)
  assert.equal(repeated.inventoryData.money.gold, 137)
  assert.equal(first.inventoryData.items.some((item) => item.properties.includes('currency')), false)
})
