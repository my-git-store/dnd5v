/** Explicit presentation mapping for the D&D 2024 species assets. */
export const SPECIES_ICON_PATHS = {
  aasimar: '/images/species/aasimar.png',
  dragonborn: '/images/species/dragonborn.png',
  dwarf: '/images/species/dwarf.png',
  elf: '/images/species/elf.png',
  gnome: '/images/species/gnome.png',
  goliath: '/images/species/goliath.png',
  halfling: '/images/species/halfling.png',
  human: '/images/species/human.png',
  orc: '/images/species/orc.png',
  tiefling: '/images/species/tiefling.png',
} as const

const SPECIES_LABELS: Record<keyof typeof SPECIES_ICON_PATHS, string> = {
  aasimar: 'Аасимар',
  dragonborn: 'Драконорождённый',
  dwarf: 'Дварф',
  elf: 'Эльф',
  gnome: 'Гном',
  goliath: 'Голиаф',
  halfling: 'Полурослик',
  human: 'Человек',
  orc: 'Орк',
  tiefling: 'Тифлинг',
}

function speciesIdFor(value?: string): keyof typeof SPECIES_ICON_PATHS | undefined {
  if (!value) return undefined
  if (value in SPECIES_ICON_PATHS) return value as keyof typeof SPECIES_ICON_PATHS
  return (Object.keys(SPECIES_LABELS) as Array<keyof typeof SPECIES_LABELS>).find((id) => SPECIES_LABELS[id] === value)
}

/** Resolve a species asset by stable ID or display label. Unknown/legacy values return no asset. */
export function speciesIconFor(value?: string): string | undefined {
  const id = speciesIdFor(value)
  return id ? SPECIES_ICON_PATHS[id] : undefined
}
