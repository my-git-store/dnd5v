import { DEFAULT_SKILLS } from './characterFields.ts'
import type { Character } from '../types/character.ts'

export function createMockCharacter(): Character {
  return {
    id: 'demo-character',
    schemaVersion: 2,
    name: 'Элара Лунный Свет',
    class: 'Волшебник',
    level: 1,
    experience: 0,
    armorClass: 12,
    abilities: { strength: 10, dexterity: 14, constitution: 12, intelligence: 16, wisdom: 13, charisma: 15 },
    skills: DEFAULT_SKILLS.map((skill) => ({ ...skill })),
    attacks: [{ id: 'attack-1', name: 'Посох', attackBonus: '+4', bonusSource: 'manual', additionalBonus: 0, damage: '1к6 + 2', description: 'Обычная атака посохом.' }],
    cantrips: [{ id: 'cantrip-1', name: 'Свет', level: 0, description: 'Создаёт яркий свет на предмете.' }],
    spells: [{ id: 'spell-1', name: 'Щит', level: 1, description: 'Защитная реакция, повышающая класс брони.' }],
    inventory: [{ id: 'item-1', name: 'Фокусировка волшебника', quantity: 1, description: 'Деревянный жезл.' }],
    money: { copper: 0, silver: 12, electrum: 0, gold: 37, platinum: 0 },
    bio: { biography: 'Ученица академии, ищущая забытые руины.', traits: 'Любит задавать вопросы.', features: 'Тёмное зрение; владение простым оружием.' },
  }
}
