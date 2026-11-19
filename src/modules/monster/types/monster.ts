export type MonsterAbilityKey = 'Сил' | 'Лов' | 'Мдр' | 'Тел' | 'Инт' | 'Хар'

export interface MonsterAbilityScore {
    score: number
    modifier: number
    proficient: boolean
}

export interface MonsterSkillRecord {
    name: string
    value: number
    ability: MonsterAbilityKey | null
    proficiency: 'none' | 'proficient' | 'expertise'
    calculationMode: 'manual' | 'computed'
    additionalBonus: number
}

export interface MonsterAttackDamageRecord {
    damage: string
    damageType: string
    additionalDamage: number
    ability: MonsterAbilityKey | null
    proficient: boolean
}

export interface MonsterAttackRecord {
    name: string
    kind: 'melee' | 'ranged' | 'spell' | 'other'
    damages: MonsterAttackDamageRecord[]
    range: number
    description: string
}

export interface Monster {
    level: string
    leader: boolean
    size: string
    type: string
    experience: number
    hitPoints: number
    bloodiedHitPoints: number
    initiative: number
    armorClass: number
    speed: string
    abilityScores: Record<MonsterAbilityKey, MonsterAbilityScore>
    skills: MonsterSkillRecord[]
    attacks: MonsterAttackRecord[]
    equipment: string
    featuresText: string
}
