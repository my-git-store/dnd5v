import { isAttackBonusSource } from '../domain/attackBonus.ts'
import type { AbilityKey, Character, CharacterAttack, CharacterSkill, CharacterSpell, CharacterV1, InventoryItem, SkillProficiency } from '../types/character.ts'

export class InvalidCharacterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCharacterError'
  }
}

export const CHARACTER_DETAIL_DEFAULTS = {
  class: '',
  level: 1,
  experience: 0,
  armorClass: 10,
} as const

/** Checks that a value can be inspected as a plain record. */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
/** Checks that a value is a finite number. */
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
/** Checks that a value is a string. */
const isString = (value: unknown): value is string => typeof value === 'string'
const ABILITY_KEYS: AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const PROFICIENCY_VALUES: SkillProficiency[] = ['none', 'proficient', 'expertise']
/** Checks that a value names one of the six ability scores. */
const isAbilityKey = (value: unknown): value is AbilityKey => typeof value === 'string' && ABILITY_KEYS.includes(value as AbilityKey)

/** Adds safe defaults to a legacy v1 payload before adapter processing. */
export function withCharacterDefaults(value: unknown): unknown {
  if (!isRecord(value) || value.schemaVersion !== 1) return value
  return { ...CHARACTER_DETAIL_DEFAULTS, ...value }
}

/** Validates a legacy spell entry. */
function validSpell(value: unknown): value is CharacterSpell {
  return isRecord(value) && isString(value.id) && isString(value.name) && isFiniteNumber(value.level) && isString(value.description)
}

/** Validates a legacy inventory item. */
function validItem(value: unknown): value is InventoryItem {
  return isRecord(value) && isString(value.id) && isString(value.name) && Number.isInteger(value.quantity) && Number(value.quantity) >= 0 && isString(value.description)
}

/** Validates a skill entry for the requested legacy schema version. */
function validSkill(value: unknown, version: 1 | 2): value is CharacterSkill {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name) || !isFiniteNumber(value.value)) return false
  if (version === 1) return true
  return (value.ability === null || isAbilityKey(value.ability))
    && typeof value.proficiency === 'string'
    && PROFICIENCY_VALUES.includes(value.proficiency as SkillProficiency)
}

/** Validates an attack entry for the requested legacy schema version. */
function validAttack(value: unknown, version: 1 | 2): value is CharacterAttack {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && isString(value.attackBonus)
    && isString(value.damage)
    && isString(value.description)
    && (version === 1 ? !('bonusSource' in value) || isAttackBonusSource(value.bonusSource) : isAttackBonusSource(value.bonusSource))
    && (version === 1 ? !('additionalBonus' in value) || (isFiniteNumber(value.additionalBonus) && Number.isInteger(value.additionalBonus)) : isFiniteNumber(value.additionalBonus) && Number.isInteger(value.additionalBonus))
}

/** Returns validation messages for a legacy v1 or v2 character payload. */
function validateVersion(value: unknown, version: 1 | 2): string[] {
  if (!isRecord(value)) return ['Персонаж должен быть объектом.']
  const errors: string[] = []
  if (value.schemaVersion !== version) errors.push('Неподдерживаемая версия схемы персонажа.')
  if (!isString(value.id) || !value.id) errors.push('Не указан идентификатор персонажа.')
  if (!isString(value.name) || !value.name.trim()) errors.push('Имя персонажа не может быть пустым.')
  if (!isString(value.class)) errors.push('Класс персонажа должен быть текстом.')
  if (!Number.isInteger(value.level) || Number(value.level) < 1) errors.push('Уровень должен быть положительным целым числом.')
  if (!Number.isInteger(value.experience) || Number(value.experience) < 0) errors.push('Опыт должен быть неотрицательным целым числом.')
  if (!Number.isInteger(value.armorClass) || Number(value.armorClass) < 0) errors.push('КД должен быть неотрицательным целым числом.')
  const abilities = value.abilities
  if (!isRecord(abilities) || !ABILITY_KEYS.every((key) => isFiniteNumber(abilities[key]))) errors.push('Характеристики должны содержать шесть числовых значений.')
  for (const field of ['skills', 'attacks', 'spells', 'cantrips', 'inventory']) {
    if (!Array.isArray(value[field])) errors.push(`Поле ${field} должно быть списком.`)
  }
  if (Array.isArray(value.skills)) value.skills.forEach((skill) => { if (!validSkill(skill, version)) errors.push('Некорректный навык.') })
  if (Array.isArray(value.spells)) value.spells.forEach((spell) => { if (!validSpell(spell) || spell.level < 1 || spell.level > 9) errors.push('Некорректное заклинание.') })
  if (Array.isArray(value.cantrips)) value.cantrips.forEach((spell) => { if (!validSpell(spell) || spell.level !== 0) errors.push('Некорректный заговор.') })
  if (Array.isArray(value.attacks)) value.attacks.forEach((attack) => { if (!validAttack(attack, version)) errors.push('Некорректная атака.') })
  if (Array.isArray(value.inventory)) value.inventory.forEach((item) => { if (!validItem(item)) errors.push('Некорректный предмет инвентаря.') })
  if (!isRecord(value.money)) errors.push('Деньги отсутствуют.')
  else Object.values(value.money).forEach((amount) => { if (!Number.isInteger(amount) || Number(amount) < 0) errors.push('Количество монет должно быть неотрицательным целым числом.') })
  const bio = value.bio
  if (!isRecord(bio) || !['biography', 'traits', 'features'].every((key) => isString(bio[key]))) errors.push('Некорректное описание персонажа.')
  return errors
}

/** Validates a current legacy character payload. */
export function validateCharacter(value: unknown): string[] {
  return validateVersion(value, 2)
}

/** Throws a typed error when a current legacy character is invalid. */
export function assertValidCharacter(value: unknown): asserts value is Character {
  const errors = validateCharacter(value)
  if (errors.length) throw new InvalidCharacterError(errors[0] ?? 'Некорректный персонаж.')
}

/** Throws a typed error when a legacy v1 character is invalid. */
export function assertValidCharacterV1(value: unknown): asserts value is CharacterV1 {
  const errors = validateVersion(value, 1)
  if (errors.length) throw new InvalidCharacterError(errors[0] ?? 'Некорректный персонаж v1.')
}
