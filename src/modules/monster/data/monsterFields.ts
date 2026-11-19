import type { MonsterAbilityKey, MonsterSkillRecord } from '../types/monster'

export const MONSTER_ABILITY_FIELDS = [
    { key: 'Сил', label: 'Сила' },
    { key: 'Лов', label: 'Ловкость' },
    { key: 'Тел', label: 'Телосложение' },
    { key: 'Инт', label: 'Интеллект' },
    { key: 'Мдр', label: 'Мудрость' },
    { key: 'Хар', label: 'Харизма' },
] as const

export const DEFAULT_MONSTER_SKILLS: MonsterSkillRecord[] = (
    [
        ['Акробатика', 'Лов'],
        ['Уход за животными', 'Мдр'],
        ['Магия', 'Инт'],
        ['Атлетика', 'Сил'],
        ['Обман', 'Хар'],
        ['История', 'Инт'],
        ['Проницательность', 'Мдр'],
        ['Запугивание', 'Хар'],
        ['Расследование', 'Инт'],
        ['Медицина', 'Мдр'],
        ['Природа', 'Инт'],
        ['Внимательность', 'Мдр'],
        ['Выступление', 'Хар'],
        ['Убеждение', 'Хар'],
        ['Религия', 'Инт'],
        ['Ловкость рук', 'Лов'],
        ['Скрытность', 'Лов'],
        ['Выживание', 'Мдр'],
    ] satisfies [string, MonsterAbilityKey][]
).map(([name, ability]) => ({
    name,
    value: 0,
    ability,
    proficiency: 'none',
    calculationMode: 'computed',
    additionalBonus: 0,
}))

export const MONSTER_IDENTITY_FIELDS = [
    { key: 'level', label: 'Уровень' },
    { key: 'size', label: 'Размер' },
    { key: 'type', label: 'Тип существа' },
] as const

export const MONSTER_COMBAT_NUMBER_FIELDS = [
    { key: 'hitPoints', label: 'Хиты' },
    { key: 'bloodiedHitPoints', label: 'Макс.Хиты' },
    { key: 'initiative', label: 'Инициатива' },
    { key: 'armorClass', label: 'КД' },
] as const

export const MONSTER_COMBAT_TEXT_FIELDS = [
    { key: 'speed', label: 'Скорость' },
] as const
