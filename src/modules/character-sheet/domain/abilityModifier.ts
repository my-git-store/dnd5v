export function abilityModifier(ability: number): number {
  return Math.floor((ability - 10) / 2)
}

export function nullableAbilityModifier(ability: unknown): number | null {
  return typeof ability === 'number' && Number.isFinite(ability) ? abilityModifier(ability) : null
}

export function signedModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value)
}
