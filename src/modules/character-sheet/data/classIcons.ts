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

/** Resolve a class asset by stable id or by the localized legacy label. */
export function classIconFor(value?: string): string | undefined {
  if (!value) return undefined
  if (value in CLASS_ICON_PATHS) return CLASS_ICON_PATHS[value as keyof typeof CLASS_ICON_PATHS]
  const id = (Object.keys(CLASS_LABELS) as Array<keyof typeof CLASS_LABELS>).find((key) => CLASS_LABELS[key] === value)
  return id ? CLASS_ICON_PATHS[id] : undefined
}
