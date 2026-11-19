import { DEFAULT_MONSTER_SKILLS, MONSTER_ABILITY_FIELDS } from '../data/monsterFields'
import { abilityModifier } from '../domain/abilityBonuses'
import type { Monster } from '../types/monster'

const MONSTER_STORAGE_KEY = 'nastolka:monster-sheet'

export function readStoredMonster(): Monster | null {
    const raw = window.localStorage.getItem(MONSTER_STORAGE_KEY)

    if (raw === null) return null

    const value: unknown = JSON.parse(raw)

    const monster = value as Monster

    if ('savingThrow' in monster) delete monster.savingThrow

    monster.bloodiedHitPoints ??= 0
    monster.attacks ??= []
    monster.skills ??= DEFAULT_MONSTER_SKILLS.map(skill => ({ ...skill }))

    for (const { key } of MONSTER_ABILITY_FIELDS) {
        const ability = monster.abilityScores[key]

        ability.proficient ??= false
        ability.modifier = abilityModifier(ability.score)
    }

    return monster
}

export function writeStoredMonster(monster: Monster): void {
    window.localStorage.setItem(MONSTER_STORAGE_KEY, JSON.stringify(monster))
}
