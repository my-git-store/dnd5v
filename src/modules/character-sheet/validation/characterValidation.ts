import type { Character, CharacterSpell, InventoryItem } from '../types/character.ts'

export class InvalidCharacterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCharacterError'
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isString = (value: unknown): value is string => typeof value === 'string'

function validSpell(value: unknown): value is CharacterSpell {
  return isRecord(value) && isString(value.id) && isString(value.name) && isFiniteNumber(value.level) && isString(value.description)
}

function validItem(value: unknown): value is InventoryItem {
  return isRecord(value) && isString(value.id) && isString(value.name) && Number.isInteger(value.quantity) && Number(value.quantity) >= 0 && isString(value.description)
}

export function validateCharacter(value: unknown): string[] {
  if (!isRecord(value)) return ['Персонаж должен быть объектом.']
  const errors: string[] = []
  if (value.schemaVersion !== 1) errors.push('Неподдерживаемая версия схемы персонажа.')
  if (!isString(value.id) || !value.id) errors.push('Не указан идентификатор персонажа.')
  if (!isString(value.name) || !value.name.trim()) errors.push('Имя персонажа не может быть пустым.')
  const abilities = value.abilities
  if (!isRecord(abilities)) errors.push('Характеристики отсутствуют.')
  else Object.values(abilities).forEach((ability) => { if (!isFiniteNumber(ability)) errors.push('Характеристики должны быть числами.') })
  for (const field of ['skills', 'attacks', 'spells', 'cantrips', 'inventory']) {
    if (!Array.isArray(value[field])) errors.push(`Поле ${field} должно быть списком.`)
  }
  if (Array.isArray(value.spells)) value.spells.forEach((spell) => { if (!validSpell(spell) || spell.level < 1 || spell.level > 9) errors.push('Некорректное заклинание.') })
  if (Array.isArray(value.cantrips)) value.cantrips.forEach((spell) => { if (!validSpell(spell) || spell.level !== 0) errors.push('Некорректный заговор.') })
  if (Array.isArray(value.inventory)) value.inventory.forEach((item) => { if (!validItem(item)) errors.push('Некорректный предмет инвентаря.') })
  if (!isRecord(value.money)) errors.push('Деньги отсутствуют.')
  else Object.values(value.money).forEach((amount) => { if (!Number.isInteger(amount) || Number(amount) < 0) errors.push('Количество монет должно быть неотрицательным целым числом.') })
  const bio = value.bio
  if (!isRecord(bio) || !['biography', 'traits', 'features'].every((key) => isString(bio[key]))) errors.push('Некорректное описание персонажа.')
  return errors
}

export function assertValidCharacter(value: unknown): asserts value is Character {
  const errors = validateCharacter(value)
  if (errors.length) throw new InvalidCharacterError(errors[0] ?? 'Некорректный персонаж.')
}
