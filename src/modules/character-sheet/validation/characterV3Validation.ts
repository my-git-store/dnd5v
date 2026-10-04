import { isAttackBonusSource } from '../domain/attackBonus.ts'
import { isCharacterRuleset } from '../domain/ruleset.ts'
import { getRules2024Feature, isBackground2024Id, isRules2024ClassId, isRules2024FeatureId, isRules2024FeatId, isRules2024SpellId, isRules2024WeaponId, isRules2024WeaponMasteryId, isSpecies2024Id } from '../data/rules2024/index.ts'
import type { AbilityKey } from '../types/character.ts'
import type { CharacterV3 } from '../types/characterV3.ts'

export class InvalidCharacterV3Error extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCharacterV3Error'
  }
}

const ABILITY_KEYS: readonly AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const PROFICIENCY_VALUES = ['none', 'proficient', 'expertise'] as const
const CALCULATION_MODES = ['manual', 'computed'] as const
const ATTACK_KINDS = ['melee', 'ranged', 'spell', 'other'] as const
const SPELL_PROGRESSION_TYPES = ['none', 'prepared', 'known', 'pact'] as const

/** Checks that a value can be inspected as a plain record. */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
/** Checks that a value is a string. */
const isString = (value: unknown): value is string => typeof value === 'string'
/** Checks that a value is a finite number. */
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
/** Checks that a value is an integer number. */
const isInteger = (value: unknown): value is number => isFiniteNumber(value) && Number.isInteger(value)
/** Checks that a value names one of the six ability scores. */
const isAbilityKey = (value: unknown): value is AbilityKey => typeof value === 'string' && ABILITY_KEYS.includes(value as AbilityKey)
/** Checks that a calculation mode is supported by the v3 sheet. */
const isCalculationMode = (value: unknown): boolean => typeof value === 'string' && CALCULATION_MODES.includes(value as typeof CALCULATION_MODES[number])
/** Checks that every member of a value is a string. */
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)
/** Checks that a skill source is one of the tracked source kinds. */
const isSkillSource = (value: unknown): boolean => value === 'race' || value === 'class' || value === 'background' || value === 'manual' || value === 'feat'
/** Checks that a source map entry uses a known domain source kind. */
const isRuleSourceKind = (value: unknown): boolean => ['species', 'race', 'class', 'background', 'feat', 'manual', 'equipment', 'spell', 'temporary-effect'].includes(String(value))

/** Validates one gained feature entry in a progression envelope. */
function validProgressionFeatureGain(value: unknown, ruleset: unknown): boolean {
  if (!isRecord(value) || !isString(value.featureId) || !value.featureId || !isInteger(value.level) || value.level < 1 || value.level > 20 || !isRecord(value.source)) return false
  if (!isString(value.source.id) || !value.source.id || !isRuleSourceKind(value.source.kind)) return false
  if (ruleset !== '2024') return true
  const feature = getRules2024Feature(value.featureId)
  return feature !== undefined && feature.level <= 20 && value.source.kind === 'class' && value.source.id === feature.classId
}

/** Validates the historical level-change entries in progression data. */
function validProgressionHistory(value: unknown, ruleset: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.every((entry) => isRecord(entry)
    && isInteger(entry.fromLevel) && entry.fromLevel >= 1 && entry.fromLevel <= 20
    && isInteger(entry.toLevel) && entry.toLevel > entry.fromLevel && entry.toLevel <= 20
    && Array.isArray(entry.gainedFeatures) && entry.gainedFeatures.every((gain) => validProgressionFeatureGain(gain, ruleset))
    && isRecord(entry.choices) && Object.values(entry.choices).every((selection) => isStringArray(selection)))
}

/** Validates the complete progression envelope and its feature references. */
function validProgression(value: unknown, ruleset: unknown): boolean {
  if (!isRecord(value) || !isInteger(value.level) || value.level < 1 || value.level > 20 || !Array.isArray(value.classLevels) || !isRecord(value.choices)) return false
  const progressionLevel = value.level
  const featureValues = value.features ?? value.featureIds
  if (!isStringArray(featureValues)) return false
  if (new Set(featureValues).size !== featureValues.length) return false
  if (!value.classLevels.every((entry) => isRecord(entry)
    && isString(entry.classId)
    && entry.classId.length > 0
    && isInteger(entry.level)
    && entry.level >= 1
    && entry.level <= 20
    && entry.level <= progressionLevel
    && (ruleset !== '2024' || isRules2024ClassId(entry.classId)))) return false
  const classIds = new Set(value.classLevels.map((entry) => isRecord(entry) && isString(entry.classId) ? entry.classId : ''))
  if (ruleset === '2024' && !featureValues.every((id) => isRules2024FeatureId(id) && (!classIds.size || classIds.has(getRules2024Feature(id)?.classId ?? '')))) return false
  if (!Object.values(value.choices).every((selection) => isStringArray(selection))) return false
  if (value.featureIds !== undefined && (!isStringArray(value.featureIds) || new Set(value.featureIds).size !== value.featureIds.length)) return false
  if (value.gainedFeatures !== undefined) {
    if (!Array.isArray(value.gainedFeatures) || new Set(value.gainedFeatures.map((gain) => isRecord(gain) ? gain.featureId : '')).size !== value.gainedFeatures.length || !value.gainedFeatures.every((gain) => validProgressionFeatureGain(gain, ruleset))) return false
    if (!value.gainedFeatures.every((gain) => isRecord(gain) && featureValues.includes(gain.featureId as string) && isInteger(gain.level) && gain.level <= progressionLevel)) return false
  }
  if (value.history !== undefined && !validProgressionHistory(value.history, ruleset)) return false
  if (value.choiceMetadata !== undefined) {
    const metadata = value.choiceMetadata
    if (!isRecord(metadata)
      || !Array.isArray(metadata.abilityScoreImprovementLevels)
      || !Array.isArray(metadata.featChoiceLevels)
      || !metadata.abilityScoreImprovementLevels.every((level) => isInteger(level) && level >= 1 && level <= 20)
      || !metadata.featChoiceLevels.every((level) => isInteger(level) && level >= 1 && level <= 20)) return false
  }
  return true
}

/** Validates the legacy race profile stored in a v3 character. */
function validRace(value: unknown): boolean {
  if (!isRecord(value)) return false
  const bonuses = value.abilityBonuses
  return isString(value.name)
    && isString(value.subrace)
    && isString(value.size)
    && isFiniteNumber(value.speed)
    && isRecord(bonuses)
    && Object.entries(bonuses).every(([key, amount]) => isAbilityKey(key) && isFiniteNumber(amount))
    && isStringArray(value.traits)
    && isStringArray(value.languages)
}

/** Validates the background profile stored in a v3 character. */
function validBackground(value: unknown): boolean {
  return isRecord(value)
    && isString(value.name)
    && isString(value.feature)
    && isStringArray(value.skillProficiencies)
    && isStringArray(value.toolProficiencies)
    && isStringArray(value.languages)
    && isString(value.notes)
}

/** Validates origin links and optional 2024 feat references. */
function validOrigin(value: unknown, ruleset: unknown): boolean {
  return isRecord(value)
    && isString(value.species)
    && isString(value.background)
    && (value.featId === undefined || (isString(value.featId) && (ruleset !== '2024' || isRules2024FeatId(value.featId))))
    && isString(value.originFeat)
    && isStringArray(value.languages)
    && isStringArray(value.tools)
}

/** Validates source tracking arrays used by proficiencies and effects. */
function validSourceMap(value: unknown): boolean {
  if (!isRecord(value)) return false
  return Object.values(value).every((sources) => Array.isArray(sources) && sources.every((source) => isRecord(source) && isRuleSourceKind(source.kind) && isString(source.id) && source.id.length > 0))
}

/** Validates additive character-creation extensions for the selected ruleset. */
function validCreationExtension(value: unknown, ruleset: unknown): boolean {
  if (!isRecord(value) || ruleset !== '2024') return true
  if (value.speciesId !== undefined && (!isString(value.speciesId) || !isSpecies2024Id(value.speciesId))) return false
  if (value.classId !== undefined && (!isString(value.classId) || !isRules2024ClassId(value.classId))) return false
  if (value.backgroundId !== undefined && (!isString(value.backgroundId) || !isBackground2024Id(value.backgroundId))) return false
  if (value.originFeatId !== undefined && (!isString(value.originFeatId) || !isRules2024FeatId(value.originFeatId))) return false
  if (value.classLevel !== undefined && (!isInteger(value.classLevel) || value.classLevel < 1 || value.classLevel > 20)) return false
  if (value.spellProgressionType !== undefined && (typeof value.spellProgressionType !== 'string' || !SPELL_PROGRESSION_TYPES.includes(value.spellProgressionType as typeof SPELL_PROGRESSION_TYPES[number]))) return false
  if (value.classSources !== undefined && (!Array.isArray(value.classSources) || !value.classSources.every((source) => isRecord(source) && source.kind === 'class' && isString(source.id) && isRules2024ClassId(source.id) && source.id.length > 0))) return false
  return true
}

/** Validates the six ability score values. */
function validAbilities(value: unknown): boolean {
  return isRecord(value) && ABILITY_KEYS.every((key) => isFiniteNumber(value[key]))
}

/** Validates a skill entry, including calculation and proficiency metadata. */
function validSkill(value: unknown): boolean {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && isFiniteNumber(value.value)
    && (value.ability === null || isAbilityKey(value.ability))
    && typeof value.proficiency === 'string'
    && PROFICIENCY_VALUES.includes(value.proficiency as typeof PROFICIENCY_VALUES[number])
    && isCalculationMode(value.calculationMode)
    && isInteger(value.additionalBonus)
    && (value.proficiencySources === undefined || (isStringArray(value.proficiencySources) && value.proficiencySources.every(isSkillSource)))
}

/** Validates an attack entry and its optional 2024 weapon links. */
function validAttack(value: unknown, ruleset: unknown): boolean {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && typeof value.kind === 'string'
    && ATTACK_KINDS.includes(value.kind as typeof ATTACK_KINDS[number])
    && isAttackBonusSource(value.abilitySource)
    && typeof value.proficient === 'boolean'
    && isString(value.attackBonus)
    && isCalculationMode(value.calculationMode)
    && isInteger(value.additionalBonus)
    && isString(value.damage)
    && isString(value.damageType)
    && isStringArray(value.properties)
    && (value.weaponMastery === undefined || isString(value.weaponMastery))
    && (value.weaponId === undefined || (isString(value.weaponId) && value.weaponId.length > 0 && (ruleset !== '2024' || isRules2024WeaponId(value.weaponId))))
    && (value.masteryId === undefined || (isString(value.masteryId) && value.masteryId.length > 0 && (ruleset !== '2024' || isRules2024WeaponMasteryId(value.masteryId))))
    && isString(value.range)
    && isString(value.description)
}

/** Validates a spell object for either a cantrip or leveled spell list. */
function validSpell(value: unknown, cantrip: boolean): boolean {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name) || !isInteger(value.level) || !isString(value.description)) return false
  if (cantrip ? value.level !== 0 : value.level < 1 || value.level > 9) return false
  return isString(value.school)
    && isString(value.castingTime)
    && isString(value.range)
    && isString(value.components)
    && isString(value.duration)
    && typeof value.concentration === 'boolean'
    && typeof value.ritual === 'boolean'
    && (value.classes === undefined || isStringArray(value.classes))
    && (value.metadata === undefined || isRecord(value.metadata))
}

/** Validates the five non-negative coin balances. */
function validMoney(value: unknown): boolean {
  return isRecord(value) && ['copper', 'silver', 'electrum', 'gold', 'platinum'].every((key) => isInteger(value[key]) && Number(value[key]) >= 0)
}

/** Validates combat resources and their bounded counters. */
function validCombat(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.armorClass) || !isRecord(value.initiative) || !isRecord(value.speed) || !isRecord(value.hitPoints) || !isRecord(value.hitDice) || !isRecord(value.deathSaves)) return false
  const armorClass = value.armorClass
  const speed = value.speed
  const hitPoints = value.hitPoints
  const hitDice = value.hitDice
  const deathSaves = value.deathSaves
  return isCalculationMode(armorClass.mode)
    && isInteger(armorClass.value)
    && (armorClass.armorBase === null || isFiniteNumber(armorClass.armorBase))
    && (armorClass.armorDexCap === null || isFiniteNumber(armorClass.armorDexCap))
    && isInteger(armorClass.shieldBonus)
    && isInteger(armorClass.additionalBonus)
    && isInteger(value.initiative.additionalBonus)
    && isFiniteNumber(speed.base)
    && (speed.fly === null || isFiniteNumber(speed.fly))
    && (speed.swim === null || isFiniteNumber(speed.swim))
    && (speed.override === null || isFiniteNumber(speed.override))
    && isInteger(hitPoints.max) && Number(hitPoints.max) >= 0
    && isInteger(hitPoints.current) && Number(hitPoints.current) >= 0
    && isInteger(hitPoints.temporary) && Number(hitPoints.temporary) >= 0
    && isString(hitDice.size)
    && isInteger(hitDice.total) && Number(hitDice.total) >= 0
    && isInteger(hitDice.spent) && Number(hitDice.spent) >= 0 && Number(hitDice.spent) <= Number(hitDice.total)
    && isInteger(deathSaves.successes) && Number(deathSaves.successes) >= 0 && Number(deathSaves.successes) <= 3
    && isInteger(deathSaves.failures) && Number(deathSaves.failures) >= 0 && Number(deathSaves.failures) <= 3
}

/** Validates saving throw proficiency flags and manual bonuses. */
function validSavingThrows(value: unknown): boolean {
  if (!isRecord(value)) return false
  return ABILITY_KEYS.every((key) => {
    const savingThrow = value[key]
    return isRecord(savingThrow) && typeof savingThrow.proficient === 'boolean' && isInteger(savingThrow.additionalBonus)
  })
}

/** Validates spellcasting metadata, catalog links, and spell slot counters. */
function validSpellcasting(value: unknown, ruleset: unknown): boolean {
  if (!isRecord(value) || (value.spellRuleset !== undefined && !isCharacterRuleset(value.spellRuleset)) || (value.spellProgressionType !== undefined && (typeof value.spellProgressionType !== 'string' || !SPELL_PROGRESSION_TYPES.includes(value.spellProgressionType as typeof SPELL_PROGRESSION_TYPES[number]))) || !(value.spellcastingAbility === null || isAbilityKey(value.spellcastingAbility)) || !Array.isArray(value.knownSpells) || !Array.isArray(value.cantrips) || !isStringArray(value.preparedSpellIds) || !isRecord(value.spellSlots)) return false
  /** Validates optional references into the ruleset spell catalog. */
  const validCatalogIds = (ids: unknown): boolean => ids === undefined || (isStringArray(ids) && ids.every((id) => id.length > 0 && (ruleset !== '2024' || isRules2024SpellId(id))))
  if (!validCatalogIds(value.spellIds) || !validCatalogIds(value.cantripIds)) return false
  if (!value.knownSpells.every((spell) => validSpell(spell, false)) || !value.cantrips.every((spell) => validSpell(spell, true))) return false
  const knownIds = new Set([...value.knownSpells.map((spell) => isRecord(spell) ? spell.id : null), ...(isStringArray(value.spellIds) ? value.spellIds : [])])
  if (!value.preparedSpellIds.every((id) => knownIds.has(id))) return false
  const spellSlots = value.spellSlots
  return SPELL_LEVELS.every((level) => {
    const slot = spellSlots[String(level)]
    return isRecord(slot) && isInteger(slot.max) && Number(slot.max) >= 0 && isInteger(slot.used) && Number(slot.used) >= 0 && Number(slot.used) <= Number(slot.max)
  })
}

/** Validates inventory items and their optional weapon catalog links. */
function validInventory(value: unknown, ruleset: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.items) || !validMoney(value.money)) return false
  return value.items.every((item) => isRecord(item)
    && isString(item.id)
    && isString(item.name)
    && isInteger(item.quantity) && Number(item.quantity) >= 0
    && (item.weight === null || isFiniteNumber(item.weight))
    && isString(item.description)
    && typeof item.equipped === 'boolean'
    && isStringArray(item.properties)
    && (item.source === undefined || item.source === 'creation' || item.source === 'user')
     && (item.weaponId === undefined || (isString(item.weaponId) && item.weaponId.length > 0 && (ruleset !== '2024' || isRules2024WeaponId(item.weaponId))))
  )
}

/** Returns all validation messages for a v3 character payload. */
export function validateCharacterV3(value: unknown): string[] {
  if (!isRecord(value)) return ['Персонаж v3 должен быть объектом.']
  const errors: string[] = []
  const identity = value.identity
  if (value.schemaVersion !== 3) errors.push('Неподдерживаемая версия схемы персонажа.')
  if (!isCharacterRuleset(value.ruleset)) errors.push('Неподдерживаемая редакция правил.')
  if (!isString(value.id) || !value.id) errors.push('Не указан идентификатор персонажа.')
  if (!isRecord(identity)
    || !isString(identity.name) || !identity.name.trim()
    || !validRace(identity.race)
    || !isString(identity.class)
    || !isString(identity.subclass)
    || !isInteger(identity.level) || identity.level < 1 || identity.level > 20
    || !isInteger(identity.experience) || identity.experience < 0
    || !validBackground(identity.background)
    || !isString(identity.alignment)) errors.push('Некорректная identity-секция.')
  if (!validAbilities(value.abilities)) errors.push('Некорректные характеристики.')
  if (!isRecord(value.proficiency) || !isStringArray(value.proficiency.toolProficiencies) || !isStringArray(value.proficiency.languageProficiencies) || (value.proficiency.languageSources !== undefined && !validSourceMap(value.proficiency.languageSources))) errors.push('Некорректная proficiency-секция.')
  if (!validSavingThrows(value.savingThrows)) errors.push('Некорректные спасброски.')
  if (!validCombat(value.combat)) errors.push('Некорректные combat-данные.')
  if (!Array.isArray(value.skills) || !value.skills.every(validSkill)) errors.push('Некорректные навыки.')
  if (!Array.isArray(value.attacks) || !value.attacks.every((attack) => validAttack(attack, value.ruleset))) errors.push('Некорректные атаки.')
  if (!validSpellcasting(value.spellcasting, value.ruleset)) errors.push('Некорректные данные магии.')
  if (!validInventory(value.inventory, value.ruleset)) errors.push('Некорректный инвентарь.')
  if (value.progression !== undefined && !validProgression(value.progression, value.ruleset)) errors.push('Некорректная progression-секция.')
  if (value.features !== undefined && (!isStringArray(value.features) || new Set(value.features).size !== value.features.length || (value.ruleset === '2024' && !value.features.every((id) => isRules2024FeatureId(id))))) errors.push('Некорректные ссылки на особенности.')
  const personality = value.personality
  if (!isRecord(personality) || !['traits', 'ideals', 'bonds', 'flaws', 'biography', 'features'].every((key) => isString(personality[key]))) errors.push('Некорректная personality-секция.')
  if (!isRecord(value.extensions)) errors.push('Некорректные extension-данные.')
  else if (!validCreationExtension(value.extensions.characterCreation, value.ruleset)) errors.push('Неизвестный вид, класс или предыстория D&D 2024 в данных создания.')
  if (!validOrigin(value.origin, value.ruleset)) errors.push('Некорректная origin-секция.')
  return errors
}

/** Throws a typed error when a v3 character payload is invalid. */
export function assertValidCharacterV3(value: unknown): asserts value is CharacterV3 {
  const errors = validateCharacterV3(value)
  if (errors.length) throw new InvalidCharacterV3Error(errors[0] ?? 'Некорректный персонаж v3.')
}
