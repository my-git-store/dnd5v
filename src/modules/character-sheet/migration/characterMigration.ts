import { SKILL_ABILITIES } from '../data/characterFields.ts'
import { assertValidCharacterV1 } from '../validation/characterValidation.ts'
import type { Character, CharacterAttack, CharacterSkill, CharacterV1 } from '../types/character.ts'

function migrateSkill(skill: Pick<CharacterSkill, 'id' | 'name' | 'value'>): CharacterSkill {
  return {
    ...skill,
    ability: SKILL_ABILITIES[skill.id] ?? null,
    proficiency: 'none',
  }
}

function migrateAttack(attack: CharacterV1['attacks'][number]): CharacterAttack {
  return {
    ...attack,
    bonusSource: attack.bonusSource ?? 'manual',
    additionalBonus: attack.additionalBonus ?? 0,
  }
}

export function migrateCharacterV1(value: unknown): Character {
  assertValidCharacterV1(value)
  return {
    ...value,
    schemaVersion: 2,
    skills: value.skills.map(migrateSkill),
    attacks: value.attacks.map(migrateAttack),
  }
}
