import { DEFAULT_MONSTER_SKILLS } from './monsterFields'
import type { Monster } from '../types/monster'

export function createEmptyMonster(): Monster {
    return {
        level: '1',
        leader: false,
        size: '',
        type: '',
        experience: 0,
        hitPoints: 0,
        bloodiedHitPoints: 0,
        initiative: 0,
        armorClass: 0,
        speed: '',
        abilityScores: {
            Сил: { score: 10, modifier: 0, proficient: false },
            Лов: { score: 10, modifier: 0, proficient: false },
            Мдр: { score: 10, modifier: 0, proficient: false },
            Тел: { score: 10, modifier: 0, proficient: false },
            Инт: { score: 10, modifier: 0, proficient: false },
            Хар: { score: 10, modifier: 0, proficient: false },
        },
        skills: DEFAULT_MONSTER_SKILLS.map(skill => ({ ...skill })),
        attacks: [],
        equipment: '',
        featuresText: '',
    }
}
