import { isAttackBonusSource } from '../domain/attackBonus.ts'
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

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isString = (value: unknown): value is string => typeof value === 'string'
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isInteger = (value: unknown): value is number => isFiniteNumber(value) && Number.isInteger(value)
const isAbilityKey = (value: unknown): value is AbilityKey => typeof value === 'string' && ABILITY_KEYS.includes(value as AbilityKey)
const isCalculationMode = (value: unknown): boolean => typeof value === 'string' && CALCULATION_MODES.includes(value as typeof CALCULATION_MODES[number])
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)
const isSkillSource = (value: unknown): boolean => value === 'race' || value === 'class' || value === 'background' || value === 'manual'

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

function validBackground(value: unknown): boolean {
  return isRecord(value)
    && isString(value.name)
    && isString(value.feature)
    && isStringArray(value.skillProficiencies)
    && isStringArray(value.toolProficiencies)
    && isStringArray(value.languages)
    && isString(value.notes)
}

function validAbilities(value: unknown): boolean {
  return isRecord(value) && ABILITY_KEYS.every((key) => isFiniteNumber(value[key]))
}

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

function validAttack(value: unknown): boolean {
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
    && isString(value.range)
    && isString(value.description)
}

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
}

function validMoney(value: unknown): boolean {
  return isRecord(value) && ['copper', 'silver', 'electrum', 'gold', 'platinum'].every((key) => isInteger(value[key]) && Number(value[key]) >= 0)
}

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

function validSavingThrows(value: unknown): boolean {
  if (!isRecord(value)) return false
  return ABILITY_KEYS.every((key) => {
    const savingThrow = value[key]
    return isRecord(savingThrow) && typeof savingThrow.proficient === 'boolean' && isInteger(savingThrow.additionalBonus)
  })
}

function validSpellcasting(value: unknown): boolean {
  if (!isRecord(value) || !(value.spellcastingAbility === null || isAbilityKey(value.spellcastingAbility)) || !Array.isArray(value.knownSpells) || !Array.isArray(value.cantrips) || !isStringArray(value.preparedSpellIds) || !isRecord(value.spellSlots)) return false
  if (!value.knownSpells.every((spell) => validSpell(spell, false)) || !value.cantrips.every((spell) => validSpell(spell, true))) return false
  const knownIds = new Set(value.knownSpells.map((spell) => isRecord(spell) ? spell.id : null))
  if (!value.preparedSpellIds.every((id) => knownIds.has(id))) return false
  const spellSlots = value.spellSlots
  return SPELL_LEVELS.every((level) => {
    const slot = spellSlots[String(level)]
    return isRecord(slot) && isInteger(slot.max) && Number(slot.max) >= 0 && isInteger(slot.used) && Number(slot.used) >= 0 && Number(slot.used) <= Number(slot.max)
  })
}

function validInventory(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.items) || !validMoney(value.money)) return false
  return value.items.every((item) => isRecord(item)
    && isString(item.id)
    && isString(item.name)
    && isInteger(item.quantity) && Number(item.quantity) >= 0
    && (item.weight === null || isFiniteNumber(item.weight))
    && isString(item.description)
    && typeof item.equipped === 'boolean'
    && isStringArray(item.properties)
    && (item.source === undefined || item.source === 'creation' || item.source === 'user'))
}

export function validateCharacterV3(value: unknown): string[] {
  if (!isRecord(value)) return ['Персонаж v3 должен быть объектом.']
  const errors: string[] = []
  const identity = value.identity
  if (value.schemaVersion !== 3) errors.push('Неподдерживаемая версия схемы персонажа.')
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
  if (!isRecord(value.proficiency) || !isStringArray(value.proficiency.toolProficiencies) || !isStringArray(value.proficiency.languageProficiencies)) errors.push('Некорректная proficiency-секция.')
  if (!validSavingThrows(value.savingThrows)) errors.push('Некорректные спасброски.')
  if (!validCombat(value.combat)) errors.push('Некорректные combat-данные.')
  if (!Array.isArray(value.skills) || !value.skills.every(validSkill)) errors.push('Некорректные навыки.')
  if (!Array.isArray(value.attacks) || !value.attacks.every(validAttack)) errors.push('Некорректные атаки.')
  if (!validSpellcasting(value.spellcasting)) errors.push('Некорректные данные магии.')
  if (!validInventory(value.inventory)) errors.push('Некорректный инвентарь.')
  const personality = value.personality
  if (!isRecord(personality) || !['traits', 'ideals', 'bonds', 'flaws', 'biography', 'features'].every((key) => isString(personality[key]))) errors.push('Некорректная personality-секция.')
  if (!isRecord(value.extensions)) errors.push('Некорректные extension-данные.')
  return errors
}

export function assertValidCharacterV3(value: unknown): asserts value is CharacterV3 {
  const errors = validateCharacterV3(value)
  if (errors.length) throw new InvalidCharacterV3Error(errors[0] ?? 'Некорректный персонаж v3.')
}
