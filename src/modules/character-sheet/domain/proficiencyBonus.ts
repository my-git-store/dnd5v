export function proficiencyBonus(level: unknown): number | null {
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 20) return null
  if (level >= 17) return 6
  if (level >= 13) return 5
  if (level >= 9) return 4
  if (level >= 5) return 3
  return 2
}
