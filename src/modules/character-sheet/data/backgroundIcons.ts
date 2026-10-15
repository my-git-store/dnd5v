/** Explicit presentation mapping for the D&D 2024 background assets. */
export const BACKGROUND_ICON_PATHS = {
  'artist-2024': '/images/backgrounds/artist.png',
  'noble-2024': '/images/backgrounds/noble.png',
  'sailor-2024': '/images/backgrounds/sailor.png',
  'sage-2024': '/images/backgrounds/sage.png',
  'hermit-2024': '/images/backgrounds/hermit.png',
  'scribe-2024': '/images/backgrounds/scribe.png',
  'acolyte-2024': '/images/backgrounds/acolyte.png',
  'criminal-2024': '/images/backgrounds/criminal.png',
  'guide-2024': '/images/backgrounds/guide.png',
  'artisan-2024': '/images/backgrounds/artisan.png',
  'soldier-2024': '/images/backgrounds/soldier.png',
  'guard-2024': '/images/backgrounds/guard.png',
  'outlander-2024': '/images/backgrounds/outlander.png',
  'merchant-2024': '/images/backgrounds/merchant.png',
  'farmer-2024': '/images/backgrounds/farmer.png',
  'charlatan-2024': '/images/backgrounds/charlatan.png',
} as const

const BACKGROUND_LABELS: Record<keyof typeof BACKGROUND_ICON_PATHS, string> = {
  'artist-2024': 'Артист',
  'noble-2024': 'Благородный',
  'sailor-2024': 'Моряк',
  'sage-2024': 'Мудрец',
  'hermit-2024': 'Отшельник',
  'scribe-2024': 'Писарь',
  'acolyte-2024': 'Послушник',
  'criminal-2024': 'Преступник',
  'guide-2024': 'Путешественник',
  'artisan-2024': 'Ремесленник',
  'soldier-2024': 'Солдат',
  'guard-2024': 'Стражник',
  'outlander-2024': 'Странник',
  'merchant-2024': 'Торговец',
  'farmer-2024': 'Фермер',
  'charlatan-2024': 'Шарлатан',
}

function backgroundIdFor(value?: string): keyof typeof BACKGROUND_ICON_PATHS | undefined {
  if (!value) return undefined
  if (value in BACKGROUND_ICON_PATHS) return value as keyof typeof BACKGROUND_ICON_PATHS
  const modernId = `${value}-2024` as keyof typeof BACKGROUND_ICON_PATHS
  if (modernId in BACKGROUND_ICON_PATHS) return modernId
  return (Object.keys(BACKGROUND_LABELS) as Array<keyof typeof BACKGROUND_LABELS>).find((id) => BACKGROUND_LABELS[id] === value)
}

/** Resolve an asset by stable ID, short 2024 ID, or display label. */
export function backgroundIconFor(value?: string): string | undefined {
  const id = backgroundIdFor(value)
  return id ? BACKGROUND_ICON_PATHS[id] : undefined
}
