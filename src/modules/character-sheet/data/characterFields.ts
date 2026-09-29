import type { AbilityKey, CharacterSkill } from '../types/character.ts'

export const ABILITY_FIELDS: Array<{ key: AbilityKey; label: string }> = [
  { key: 'strength', label: 'Сила' },
  { key: 'dexterity', label: 'Ловкость' },
  { key: 'constitution', label: 'Телосложение' },
  { key: 'intelligence', label: 'Интеллект' },
  { key: 'wisdom', label: 'Мудрость' },
  { key: 'charisma', label: 'Харизма' },
]

export const DEFAULT_SKILLS: CharacterSkill[] = ([
  ['acrobatics', 'Акробатика'], ['animal-handling', 'Уход за животными'],
  ['arcana', 'Магия'], ['athletics', 'Атлетика'], ['deception', 'Обман'],
  ['history', 'История'], ['insight', 'Проницательность'], ['intimidation', 'Запугивание'],
  ['investigation', 'Расследование'], ['medicine', 'Медицина'], ['nature', 'Природа'],
  ['perception', 'Внимательность'], ['performance', 'Выступление'], ['persuasion', 'Убеждение'],
  ['religion', 'Религия'], ['sleight-of-hand', 'Ловкость рук'], ['stealth', 'Скрытность'],
  ['survival', 'Выживание'],
] satisfies [string, string][]).map(([id, name]) => ({ id, name, value: 0 }))
