import { abilityModifier } from './abilityModifier.ts'
import { DICE_TYPES, rollDie, type DiceSides } from '../../table-components/domain/dice.ts'
import type { CharacterAbilities } from '../types/character.ts'
import type { CharacterCombatV3, CharacterSpellSlotsV3 } from '../types/characterV3.ts'

export interface ShortRestResult {
  combat: CharacterCombatV3
  rolls: number[]
  healing: number
  spent: number
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function hitDieSides(size: string): DiceSides | null {
  const sides = Number(size.match(/^d(\d+)$/i)?.[1] ?? 0)
  return DICE_TYPES.includes(sides as DiceSides) ? sides as DiceSides : null
}

/** Applies a short rest without changing unrelated combat fields. */
export function takeShortRest(
  combat: CharacterCombatV3,
  abilities: Partial<CharacterAbilities>,
  requestedDice: unknown,
  random = Math.random,
): ShortRestResult {
  const next = clone(combat)
  const available = Math.max(0, next.hitDice.total - next.hitDice.spent)
  const requested = Number.isFinite(Number(requestedDice)) ? Math.max(0, Math.trunc(Number(requestedDice))) : 0
  const count = Math.min(available, requested)
  const sides = hitDieSides(next.hitDice.size)
  if (count === 0 || sides === null) return { combat: next, rolls: [], healing: 0, spent: 0 }

  const constitutionModifier = abilityModifier(typeof abilities.constitution === 'number' ? abilities.constitution : 10)
  const rolls: number[] = []
  let healing = 0
  for (let index = 0; index < count; index += 1) {
    const roll = rollDie(sides, random)
    rolls.push(roll)
    healing += Math.max(1, roll + constitutionModifier)
  }
  next.hitDice.spent += count
  next.hitPoints.current = Math.min(next.hitPoints.max, next.hitPoints.current + healing)
  return { combat: next, rolls, healing, spent: count }
}

/** Applies a long rest using the standard half-of-total hit-dice recovery rule. */
export function takeLongRest(combat: CharacterCombatV3): CharacterCombatV3 {
  const next = clone(combat)
  next.hitPoints.current = next.hitPoints.max
  next.hitPoints.temporary = 0
  next.hitDice.spent = Math.max(0, next.hitDice.spent - Math.max(1, Math.floor(next.hitDice.total / 2)))
  next.deathSaves = { successes: 0, failures: 0 }
  return next
}

export function restoreSpellSlots(slots: CharacterSpellSlotsV3): CharacterSpellSlotsV3 {
  return Object.fromEntries(Object.entries(slots).map(([level, slot]) => [level, { max: slot.max, used: 0 }])) as unknown as CharacterSpellSlotsV3
}

export function changeSpellSlot(slots: CharacterSpellSlotsV3, level: keyof CharacterSpellSlotsV3, delta: number): CharacterSpellSlotsV3 {
  const next = clone(slots)
  const slot = next[level]
  slot.used = Math.min(slot.max, Math.max(0, slot.used + Math.trunc(delta)))
  return next
}
