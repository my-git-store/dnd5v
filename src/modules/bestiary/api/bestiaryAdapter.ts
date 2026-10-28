import type { BestiaryEntry } from '../types.ts'

export interface BestiaryAdapter {
  list(): readonly BestiaryEntry[]
  getById(id: string): BestiaryEntry | undefined
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function createBestiaryAdapter(entries: readonly BestiaryEntry[]): BestiaryAdapter {
  const source = clone(entries)
  return {
    list: () => clone(source),
    getById: (id) => {
      const entry = source.find((item) => item.id === id)
      return entry ? clone(entry) : undefined
    },
  }
}
