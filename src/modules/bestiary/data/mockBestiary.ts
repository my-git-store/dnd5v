import type { BestiaryEntry } from '../types.ts'
import { createBestiaryAdapter } from '../api/bestiaryAdapter.ts'

const entry = (value: BestiaryEntry): BestiaryEntry => value

/** Небольшой авторский dataset для локального MVP; внешний контент не копируется. */
export const MOCK_BESTIARY: readonly BestiaryEntry[] = [
  entry({
    id: 'ashen-scout', name: 'Пепельный разведчик', size: 'Средний', creatureType: 'Гуманоид', alignment: 'Нейтральный', challengeRating: '1/2', proficiencyBonus: 2,
    environment: ['Руины', 'Пустоши'], source: 'Демо-каталог', languages: ['Общий'], speed: 30, armorClass: 13, hitPoints: 18, initiative: 2,
    abilities: { strength: 11, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 13, charisma: 9 },
    savingThrows: [], skills: [{ id: 'stealth', name: 'Скрытность', value: 4 }], senses: 'Пассивная внимательность 11',
    features: [{ id: 'quiet-step', name: 'Тихий шаг', description: 'Получает преимущество на проверку Скрытности в руинах.', attackBonus: '', damage: '' }],
    actions: [{ id: 'short-bow', name: 'Короткий лук', description: 'Дальнобойная атака по одной цели.', attackBonus: '+4', damage: '1d6+2' }], reactions: [], legendaryActions: [],
  }),
  entry({
    id: 'mossback-brute', name: 'Мохоспинный громила', size: 'Большой', creatureType: 'Зверь', alignment: 'Без мировоззрения', challengeRating: '2', proficiencyBonus: 2,
    environment: ['Лес', 'Болота'], source: 'Демо-каталог', languages: [], speed: 30, armorClass: 14, hitPoints: 42, initiative: 1,
    abilities: { strength: 18, dexterity: 12, constitution: 16, intelligence: 3, wisdom: 11, charisma: 5 },
    savingThrows: [{ id: 'str', name: 'Сила', value: 6 }], skills: [], senses: 'Тёмное зрение 60 фт.',
    features: [{ id: 'thick-hide', name: 'Толстая шкура', description: 'Снижает урон от первого попадания за раунд на 2.', attackBonus: '', damage: '' }],
    actions: [{ id: 'maul', name: 'Удар лапой', description: 'Сильный удар по одной цели.', attackBonus: '+6', damage: '2d6+4' }], reactions: [], legendaryActions: [],
  }),
  entry({
    id: 'lantern-wisp', name: 'Фонарный огонёк', size: 'Крошечный', creatureType: 'Элементаль', alignment: 'Хаотичный добрый', challengeRating: '1', proficiencyBonus: 2,
    environment: ['Пещеры', 'Руины'], source: 'Демо-каталог', languages: ['Общий', 'Первичный'], speed: 20, armorClass: 15, hitPoints: 12, initiative: 4,
    abilities: { strength: 4, dexterity: 18, constitution: 10, intelligence: 12, wisdom: 14, charisma: 16 },
    savingThrows: [], skills: [{ id: 'perception', name: 'Внимательность', value: 4 }], senses: 'Тёмное зрение 60 фт., истинное зрение 10 фт.',
    features: [{ id: 'glimmer', name: 'Мерцание', description: 'Освещает пространство вокруг себя и может скрыться в слабом свете.', attackBonus: '', damage: '' }],
    actions: [{ id: 'spark', name: 'Искра', description: 'Дальнобойная магическая атака.', attackBonus: '+5', damage: '2d4+3' }], reactions: [], legendaryActions: [],
  }),
  entry({
    id: 'river-tusk', name: 'Речной бивень', size: 'Средний', creatureType: 'Монстр', alignment: 'Нейтральный злой', challengeRating: '3', proficiencyBonus: 2,
    environment: ['Реки', 'Болота'], source: 'Демо-каталог', languages: [], speed: 40, armorClass: 12, hitPoints: 55, initiative: 0,
    abilities: { strength: 16, dexterity: 10, constitution: 15, intelligence: 6, wisdom: 10, charisma: 7 },
    savingThrows: [], skills: [], senses: 'Пассивная внимательность 10',
    features: [], actions: [{ id: 'tusk', name: 'Бивни', description: 'Ближняя атака по одной цели.', attackBonus: '+5', damage: '2d8+3' }], reactions: [], legendaryActions: [],
  }),
]

export const mockBestiaryAdapter = () => createBestiaryAdapter(MOCK_BESTIARY)
