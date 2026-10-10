import { SKILL_ABILITIES } from '../data/characterFields.ts'
import { isAttackBonusSource } from '../domain/attackBonus.ts'
import { DEFAULT_CHARACTER_RULESET, isCharacterRuleset } from '../domain/ruleset.ts'
import { migrateCharacterV1 } from './characterMigration.ts'
import { assertValidCharacterV3 } from '../validation/characterV3Validation.ts'
import { assertValidCharacter, assertValidCharacterV1, withCharacterDefaults } from '../validation/characterValidation.ts'
import { defaultProgressionForCharacter, normalizeProgression } from '../domain/characterProgression.ts'
import { getRules2024Spell, isRules2024SpellId } from '../data/rules2024/index.ts'
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
    calculationMode: source.calculationMode === 'manual' ? 'manual' : 'computed',
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
    weaponMastery: isString(source.weaponMastery) ? source.weaponMastery : '',
    ...(isString(source.weaponId) && source.weaponId ? { weaponId: source.weaponId } : {}),
    ...(isString(source.masteryId) && source.masteryId ? { masteryId: source.masteryId } : {}),
    range: isString(source.range) ? source.range : '',
    description: attack.description,
  } as CharacterAttackV3
}

function migrateSpell(spell: CharacterSpell): CharacterSpellV3 {
  const raw = cloneJson(spell) as unknown as Record<string, unknown>
  const source = omitKeys(raw, ['classes', 'metadata'])
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
    ...(isStringArray(raw.classes) ? { classes: [...raw.classes] } : {}),
    ...(isRecord(raw.metadata) ? { metadata: cloneJson(raw.metadata) } : {}),
  } as CharacterSpellV3
}

function spellFromDefinition(id: string): CharacterSpellV3 | undefined {
  const definition = getRules2024Spell(id)
  if (!definition) return undefined
  return {
    id: definition.id,
    name: definition.name,
    level: definition.level,
    description: definition.description,
    school: definition.school,
    castingTime: definition.castingTime,
    range: definition.range,
    components: definition.components,
    duration: definition.duration,
    concentration: definition.duration.toLowerCase().includes('концентрация'),
    ritual: false,
    classes: [...definition.classes],
    metadata: cloneJson(definition.metadata),
  }
}

function canonicalSpellIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.flatMap((spell) => isRecord(spell) && isString(spell.id) && isRules2024SpellId(spell.id) ? [spell.id] : []))]
}

function hydrateCatalogSpells(value: unknown, ids: string[]): unknown[] {
  const existing = Array.isArray(value) ? [...value] : []
  for (const id of ids) {
    if (existing.some((spell) => isRecord(spell) && spell.id === id)) continue
    const catalogSpell = spellFromDefinition(id)
    if (catalogSpell) existing.push(catalogSpell)
  }
  return existing
}

function normalizeSpellcasting(value: Record<string, unknown>, ruleset: unknown): void {
  const spellcasting = value.spellcasting
  if (!isRecord(spellcasting)) return
  const knownSpells = spellcasting.knownSpells
  const cantrips = spellcasting.cantrips
  const spellIds = spellcasting.spellIds === undefined
    ? (ruleset === '2024' ? canonicalSpellIds(knownSpells) : [])
    : (isStringArray(spellcasting.spellIds) ? [...new Set(spellcasting.spellIds)] : spellcasting.spellIds)
  const cantripIds = spellcasting.cantripIds === undefined
    ? (ruleset === '2024' ? canonicalSpellIds(cantrips) : [])
    : (isStringArray(spellcasting.cantripIds) ? [...new Set(spellcasting.cantripIds)] : spellcasting.cantripIds)
  spellcasting.spellIds = spellIds
  spellcasting.cantripIds = cantripIds
  if (ruleset === '2024') {
    if (isStringArray(spellIds)) spellcasting.knownSpells = hydrateCatalogSpells(knownSpells, spellIds)
    if (isStringArray(cantripIds)) spellcasting.cantrips = hydrateCatalogSpells(cantrips, cantripIds)
  }
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
    ...(isString(source.weaponId) && source.weaponId ? { weaponId: source.weaponId } : {}),
  } as CharacterInventoryItemV3
}

export function migrateCharacterV2ToV3(value: Character): CharacterV3 {
  assertValidCharacter(value)
  const source = value as unknown as Record<string, unknown>
  const migrated: CharacterV3 = {
    id: value.id,
    schemaVersion: 3,
    ruleset: '2014',
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
    spellcasting: { spellRuleset: '2014', spellcastingAbility: null, spellIds: [], cantripIds: [], knownSpells: value.spells.map(migrateSpell), preparedSpellIds: [], cantrips: value.cantrips.map(migrateSpell), spellSlots: createSpellSlots() },
    inventory: { items: value.inventory.map(migrateInventoryItem), money: cloneJson(value.money) },
    personality: { traits: value.bio.traits, ideals: '', bonds: '', flaws: '', biography: value.bio.biography, features: value.bio.features },
    origin: { species: '', background: '', originFeat: '', languages: [], tools: [] },
    extensions: collectExtensions(source),
  }
  migrated.progression = defaultProgressionForCharacter(migrated)
  migrated.features = [...migrated.progression.features]
  return migrated
}

/** Adds safe defaults for fields introduced after the first v3 release. */
function normalizeCharacterV3(value: Record<string, unknown>): CharacterV3 {
  const next = cloneJson(value) as unknown as CharacterV3
  next.ruleset = isCharacterRuleset(value.ruleset) ? value.ruleset : DEFAULT_CHARACTER_RULESET
  if (isRecord(value.spellcasting) && (value.spellcasting.spellRuleset === undefined || value.spellcasting.spellRuleset === null)) {
    next.spellcasting.spellRuleset = next.ruleset
  }
  normalizeSpellcasting(next as unknown as Record<string, unknown>, next.ruleset)
  const origin = isRecord(value.origin) ? value.origin : {}
  const legacyRace = isRecord(value.identity) && isRecord(value.identity.race) ? value.identity.race : {}
  const legacyBackground = isRecord(value.identity) && isRecord(value.identity.background) ? value.identity.background : {}
  const creation = isRecord(value.extensions) && isRecord(value.extensions.characterCreation) ? value.extensions.characterCreation : {}
  const featId = typeof origin.featId === 'string' && origin.featId ? origin.featId : (typeof creation.originFeatId === 'string' && creation.originFeatId ? creation.originFeatId : undefined)
  next.origin = {
    species: typeof origin.species === 'string' ? origin.species : (typeof legacyRace.name === 'string' ? legacyRace.name : ''),
    background: typeof origin.background === 'string' ? origin.background : (typeof legacyBackground.name === 'string' ? legacyBackground.name : ''),
    ...(featId ? { featId } : {}),
    originFeat: typeof origin.originFeat === 'string' ? origin.originFeat : '',
    languages: isStringArray(origin.languages) ? [...origin.languages] : (isStringArray(legacyRace.languages) ? [...legacyRace.languages] : []),
    tools: isStringArray(origin.tools) ? [...origin.tools] : (isStringArray(legacyBackground.toolProficiencies) ? [...legacyBackground.toolProficiencies] : []),
  }
  if (value.progression === undefined) {
    next.progression = defaultProgressionForCharacter(next)
  } else if (isRecord(value.progression)) {
    const progression = next.progression as unknown as Record<string, unknown>
    if (progression.features === undefined && isStringArray(progression.featureIds)) {
      progression.features = [...progression.featureIds]
      delete progression.featureIds
    }
    if (isStringArray(progression.features) && Array.isArray(progression.classLevels) && isRecord(progression.choices)) {
      next.progression = normalizeProgression(next.progression!, next.ruleset)
    }
  }
  if (value.features === undefined) {
    next.features = isStringArray(next.progression?.features) ? [...next.progression.features] : []
  } else if (isStringArray(value.features)) {
    next.features = [...value.features]
  }
  // The top-level list is the public character envelope; keep the progression
  // view synchronized when an older v3 record already contains that list.
  if (next.progression && isStringArray(next.features)) {
    next.progression = normalizeProgression({ ...next.progression, features: [...next.features] }, next.ruleset)
  }
  return next
}

export function migrateCharacterToV3(value: unknown): CharacterV3 {
  if (!isRecord(value) || typeof value.schemaVersion !== 'number') throw new Error('Невозможно определить версию персонажа.')
  if (value.schemaVersion === 3) {
    const normalized = normalizeCharacterV3(value)
    assertValidCharacterV3(normalized)
    return cloneCharacterV3(normalized)
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
