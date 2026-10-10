import type { CharacterGender } from '../types/character.ts'

/** Explicit asset mapping for the twelve D&D 2024 classes. */
export const CLASS_ICON_PATHS = {
  barbarian: '/images/classes/barbarian.png',
  bard: '/images/classes/bard.png',
  cleric: '/images/classes/cleric.png',
  druid: '/images/classes/druid.png',
  fighter: '/images/classes/fighter.png',
  monk: '/images/classes/monk.png',
  paladin: '/images/classes/paladin.png',
  ranger: '/images/classes/ranger.png',
  rogue: '/images/classes/rogue.png',
  sorcerer: '/images/classes/sorcerer.png',
  warlock: '/images/classes/warlock.png',
  wizard: '/images/classes/wizard.png',
} as const

export const CLASS_ICON_PATHS_MALE = {
  barbarian: '/images/classes/barbarian-male.png',
  bard: '/images/classes/bard-male.png',
  cleric: '/images/classes/cleric-male.png',
  druid: '/images/classes/druid-male.png',
  fighter: '/images/classes/fighter-male.png',
  monk: '/images/classes/monk-male.png',
  paladin: '/images/classes/paladin-male.png',
  ranger: '/images/classes/ranger-male.png',
  rogue: '/images/classes/rogue-male.png',
  sorcerer: '/images/classes/sorcerer-male.png',
  warlock: '/images/classes/warlock-male.png',
  wizard: '/images/classes/wizard-male.png',
} as const

export const CLASS_ICON_PATHS_BY_GENDER = {
  female: CLASS_ICON_PATHS,
  male: CLASS_ICON_PATHS_MALE,
} as const

const CLASS_LABELS = {
  barbarian: 'Варвар',
  bard: 'Бард',
  cleric: 'Жрец',
  druid: 'Друид',
  fighter: 'Воин',
  monk: 'Монах',
  paladin: 'Паладин',
  ranger: 'Следопыт',
  rogue: 'Плут',
  sorcerer: 'Чародей',
  warlock: 'Колдун',
  wizard: 'Волшебник',
} as const

function classIdFor(value?: string): keyof typeof CLASS_ICON_PATHS | undefined {
  if (!value) return undefined
  if (value in CLASS_ICON_PATHS) return value as keyof typeof CLASS_ICON_PATHS
  const id = (Object.keys(CLASS_LABELS) as Array<keyof typeof CLASS_LABELS>).find((key) => CLASS_LABELS[key] === value)
  return id
}

/** Resolve a class asset by stable id, localized label and presentation gender. */
export function classIconFor(value?: string, gender: CharacterGender = 'female'): string | undefined {
  const id = classIdFor(value)
  if (!id) return undefined
  return CLASS_ICON_PATHS_BY_GENDER[gender]?.[id] ?? CLASS_ICON_PATHS[id]
}

/** Return all available portrait variants for a class definition. */
export function classIconVariantsFor(value?: string): Partial<Record<CharacterGender, string>> {
  const id = classIdFor(value)
  if (!id) return {}
  return { female: CLASS_ICON_PATHS[id], male: CLASS_ICON_PATHS_MALE[id] }
}
