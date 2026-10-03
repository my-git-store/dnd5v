import { SKILL_ABILITIES } from '../data/characterFields.ts'
import { isAttackBonusSource } from '../domain/attackBonus.ts'
import { migrateCharacterV1 } from './characterMigration.ts'
import { assertValidCharacterV3 } from '../validation/characterV3Validation.ts'
import { assertValidCharacter, assertValidCharacterV1, withCharacterDefaults } from '../validation/characterValidation.ts'
import { cloneCharacterV3, type CharacterAttackV3, type CharacterInventoryItemV3, type CharacterSkillV3, type CharacterSpellV3, type CharacterSpellSlotsV3, type CharacterV3 } from '../types/characterV3.ts'
import type { AbilityKey, Character, CharacterAttack, CharacterSkill, CharacterSpell, InventoryItem } from '../types/character.ts'

const ABILITY_KEYS: readonly AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const V2_ROOT_FIELDS = new Set(['id', 'schemaVersion', 'name', 'class', 'level', 'experience', 'armorClass', 'abilities', 'skills', 'attacks', 'spells', 'cantrips', 'inventory', 'money', 'bio'])

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isString = (value: unknown): value is string => typeof value === 'string'
const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function omitKeys(value: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const result = { ...value }
  for (const key of keys) delete result[key]
  return result
}

function collectExtensions(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !V2_ROOT_FIELDS.has(key))
      .map(([key, nestedValue]) => [key, cloneJson(nestedValue)]),
  )
}

function createSavingThrows(): CharacterV3['savingThrows'] {
  return Object.fromEntries(ABILITY_KEYS.map((key) => [key, { proficient: false, additionalBonus: 0 }])) as CharacterV3['savingThrows']
}

function createSpellSlots(): CharacterSpellSlotsV3 {
  return {
    1: { max: 0, used: 0 },
    2: { max: 0, used: 0 },
    3: { max: 0, used: 0 },
    4: { max: 0, used: 0 },
    5: { max: 0, used: 0 },
    6: { max: 0, used: 0 },
    7: { max: 0, used: 0 },
    8: { max: 0, used: 0 },
    9: { max: 0, used: 0 },
  }
}

function migrateSkill(skill: CharacterSkill): CharacterSkillV3 {
  const source = cloneJson(skill) as unknown as Record<string, unknown>
  const ability = source.ability === null || typeof source.ability === 'string' ? source.ability : SKILL_ABILITIES[skill.id] ?? null
  const proficiency = source.proficiency === 'proficient' || source.proficiency === 'expertise' ? source.proficiency : 'none'
  return {
    ...source,
    id: skill.id,
    name: skill.name,
    value: skill.value,
    ability: (ability as AbilityKey | null) ?? null,
    proficiency,
    calculationMode: source.calculationMode === 'computed' ? 'computed' : 'manual',
    additionalBonus: isInteger(source.additionalBonus) ? source.additionalBonus : 0,
  } as CharacterSkillV3
}

function migrateAttack(attack: CharacterAttack): CharacterAttackV3 {
  const source = omitKeys(cloneJson(attack) as unknown as Record<string, unknown>, ['bonusSource'])
  const abilitySource = isAttackBonusSource(attack.bonusSource) ? attack.bonusSource : 'manual'
  return {
    ...source,
    id: attack.id,
    name: attack.name,
    kind: 'other',
    abilitySource,
    proficient: false,
    attackBonus: attack.attackBonus,
    calculationMode: 'manual',
    additionalBonus: isInteger(attack.additionalBonus) ? attack.additionalBonus : 0,
    damage: attack.damage,
    damageType: isString(source.damageType) ? source.damageType : '',
    properties: isStringArray(source.properties) ? source.properties : [],
    range: isString(source.range) ? source.range : '',
    description: attack.description,
  } as CharacterAttackV3
}

function migrateSpell(spell: CharacterSpell): CharacterSpellV3 {
  const source = cloneJson(spell) as unknown as Record<string, unknown>
  return {
    ...source,
    id: spell.id,
    name: spell.name,
    level: spell.level,
    description: spell.description,
    school: isString(source.school) ? source.school : '',
    castingTime: isString(source.castingTime) ? source.castingTime : '',
    range: isString(source.range) ? source.range : '',
    components: isString(source.components) ? source.components : '',
    duration: isString(source.duration) ? source.duration : '',
    concentration: source.concentration === true,
    ritual: source.ritual === true,
  } as CharacterSpellV3
}

function migrateInventoryItem(item: InventoryItem): CharacterInventoryItemV3 {
  const source = cloneJson(item) as unknown as Record<string, unknown>
  return {
    ...source,
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    weight: typeof source.weight === 'number' && Number.isFinite(source.weight) ? source.weight : null,
    description: item.description,
    equipped: source.equipped === true,
    properties: isStringArray(source.properties) ? source.properties : [],
  } as CharacterInventoryItemV3
}

export function migrateCharacterV2ToV3(value: Character): CharacterV3 {
  assertValidCharacter(value)
  const source = value as unknown as Record<string, unknown>
  return {
    id: value.id,
    schemaVersion: 3,
    identity: {
      name: value.name,
      race: { name: '', subrace: '', size: '', speed: 0, abilityBonuses: {}, traits: [], languages: [] },
      class: value.class,
      subclass: '',
      level: value.level,
      experience: value.experience,
      background: { name: '', feature: '', skillProficiencies: [], toolProficiencies: [], languages: [], notes: '' },
      alignment: '',
    },
    abilities: cloneJson(value.abilities),
    proficiency: { toolProficiencies: [], languageProficiencies: [] },
    savingThrows: createSavingThrows(),
    combat: {
      armorClass: { mode: 'manual', value: value.armorClass, armorBase: null, armorDexCap: null, shieldBonus: 0, additionalBonus: 0 },
      initiative: { additionalBonus: 0 },
      speed: { base: 0, fly: null, swim: null, override: null },
      hitPoints: { max: 0, current: 0, temporary: 0 },
      hitDice: { size: '', total: 0, spent: 0 },
      deathSaves: { successes: 0, failures: 0 },
    },
    skills: value.skills.map(migrateSkill),
    attacks: value.attacks.map(migrateAttack),
    spellcasting: { spellcastingAbility: null, knownSpells: value.spells.map(migrateSpell), preparedSpellIds: [], cantrips: value.cantrips.map(migrateSpell), spellSlots: createSpellSlots() },
    inventory: { items: value.inventory.map(migrateInventoryItem), money: cloneJson(value.money) },
    personality: { traits: value.bio.traits, ideals: '', bonds: '', flaws: '', biography: value.bio.biography, features: value.bio.features },
    extensions: collectExtensions(source),
  }
}

export function migrateCharacterToV3(value: unknown): CharacterV3 {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') throw new Error('Невозможно определить версию персонажа.')
  if (value.schemaVersion === 3) {
    assertValidCharacterV3(value)
    return cloneCharacterV3(value)
  }
  if (value.schemaVersion === 2) {
    assertValidCharacter(value)
    return migrateCharacterV2ToV3(value)
  }
  if (value.schemaVersion === 1) {
    const withDefaults = withCharacterDefaults(value)
    assertValidCharacterV1(withDefaults)
    return migrateCharacterV2ToV3(migrateCharacterV1(withDefaults))
  }
  throw new Error('Неподдерживаемая версия схемы персонажа.')
}
