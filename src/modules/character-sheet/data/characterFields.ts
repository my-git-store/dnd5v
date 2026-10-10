import type { AbilityKey, AttackBonusSource, CharacterSkill } from '../types/character.ts'

export const ABILITY_FIELDS: Array<{ key: AbilityKey; label: string }> = [
  { key: 'strength', label: 'Сила' },
  { key: 'dexterity', label: 'Ловкость' },
  { key: 'constitution', label: 'Телосложение' },
  { key: 'intelligence', label: 'Интеллект' },
  { key: 'wisdom', label: 'Мудрость' },
  { key: 'charisma', label: 'Харизма' },
]

export const SKILL_ABILITIES: Record<string, AbilityKey> = {
  acrobatics: 'dexterity',
  'animal-handling': 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  'sleight-of-hand': 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
}

export const DEFAULT_SKILLS: CharacterSkill[] = ([
  ['acrobatics', 'Акробатика'], ['animal-handling', 'Уход за животными'],
  ['arcana', 'Магия'], ['athletics', 'Атлетика'], ['deception', 'Обман'],
  ['history', 'История'], ['insight', 'Проницательность'], ['intimidation', 'Запугивание'],
  ['investigation', 'Расследование'], ['medicine', 'Медицина'], ['nature', 'Природа'],
  ['perception', 'Внимательность'], ['performance', 'Выступление'], ['persuasion', 'Убеждение'],
  ['religion', 'Религия'], ['sleight-of-hand', 'Ловкость рук'], ['stealth', 'Скрытность'],
  ['survival', 'Выживание'],
] satisfies [string, string][]).map(([id, name]) => ({
  id, name, value: 0, ability: SKILL_ABILITIES[id] ?? null, proficiency: 'none',
}))

export const ATTACK_BONUS_SOURCES: Array<{ value: AttackBonusSource; label: string }> = [
  { value: 'manual', label: 'Ручной бонус (старый формат)' },
  { value: 'strength', label: 'Сила' },
  { value: 'dexterity', label: 'Ловкость' },
  { value: 'constitution', label: 'Телосложение' },
  { value: 'intelligence', label: 'Интеллект' },
  { value: 'wisdom', label: 'Мудрость' },
  { value: 'charisma', label: 'Харизма' },
]
