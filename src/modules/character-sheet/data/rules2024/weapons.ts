import type { WeaponDefinition, WeaponMasteryDefinition } from '../../types/rules.ts'

export const RULES_2024_WEAPON_MASTERIES: WeaponMasteryDefinition[] = [
  { id: 'cleave', name: 'Cleave', description: 'После попадания позволяет провести дополнительную атаку по другой цели в пределах досягаемости; модификатор характеристики к этому урону не добавляется.' },
  { id: 'graze', name: 'Graze', description: 'При промахе оружие может нанести урон, равный модификатору характеристики, использованному для атаки.' },
  { id: 'nick', name: 'Nick', description: 'Позволяет выполнить дополнительную атаку лёгким оружием в рамках действия Атака.' },
  { id: 'push', name: 'Push', description: 'При попадании позволяет оттолкнуть цель на 10 футов.' },
  { id: 'sap', name: 'Sap', description: 'При попадании цель получает помеху на следующий бросок атаки до начала вашего следующего хода.' },
  { id: 'slow', name: 'Slow', description: 'При попадании скорость цели уменьшается на 10 футов до начала вашего следующего хода.' },
  { id: 'topple', name: 'Topple', description: 'При попадании цель должна пройти спасбросок Телосложения или упасть ничком.' },
  { id: 'vex', name: 'Vex', description: 'После попадания следующий бросок атаки по этой цели до конца вашего следующего хода получает преимущество.' },
]

const weapon = (
  id: string,
  name: string,
  category: WeaponDefinition['category'],
  damage: string,
  damageType: string,
  properties: string[],
  mastery: string,
): WeaponDefinition => ({ id, ruleset: '2024', name, category, damage, damageType, properties, mastery })

export const RULES_2024_WEAPONS: WeaponDefinition[] = [
  weapon('club', 'Дубинка', 'melee', '1d4', 'Дробящий', ['Лёгкое'], 'slow'),
  weapon('dagger', 'Кинжал', 'melee', '1d4', 'Колющий', ['Лёгкое', 'Финесса', 'Метательное (20/60)'], 'nick'),
  weapon('greatclub', 'Большая дубина', 'melee', '1d8', 'Дробящий', ['Двуручное'], 'push'),
  weapon('handaxe', 'Ручной топор', 'melee', '1d6', 'Рубящий', ['Лёгкое', 'Метательное (20/60)'], 'vex'),
  weapon('javelin', 'Дротик', 'melee', '1d6', 'Колющий', ['Метательное (30/120)'], 'sap'),
  weapon('light-hammer', 'Лёгкий молот', 'melee', '1d4', 'Дробящий', ['Лёгкое', 'Метательное (20/60)'], 'nick'),
  weapon('mace', 'Булава', 'melee', '1d6', 'Дробящий', [], 'sap'),
  weapon('quarterstaff', 'Боевой посох', 'melee', '1d6', 'Дробящий', ['Универсальное (1d8)'], 'topple'),
  weapon('sickle', 'Серп', 'melee', '1d4', 'Рубящий', ['Лёгкое'], 'nick'),
  weapon('spear', 'Копьё', 'melee', '1d6', 'Колющий', ['Метательное (20/60)', 'Универсальное (1d8)'], 'sap'),
  weapon('battleaxe', 'Боевой топор', 'melee', '1d8', 'Рубящий', ['Универсальное (1d10)'], 'topple'),
  weapon('flail', 'Цеп', 'melee', '1d8', 'Дробящий', [], 'sap'),
  weapon('glaive', 'Глефа', 'melee', '1d10', 'Рубящий', ['Тяжёлое', 'Досягаемость', 'Двуручное'], 'graze'),
  weapon('greataxe', 'Секира', 'melee', '1d12', 'Рубящий', ['Тяжёлое', 'Двуручное'], 'cleave'),
  weapon('greatsword', 'Двуручный меч', 'melee', '2d6', 'Рубящий', ['Тяжёлое', 'Двуручное'], 'graze'),
  weapon('halberd', 'Алебарда', 'melee', '1d10', 'Рубящий', ['Тяжёлое', 'Досягаемость', 'Двуручное'], 'cleave'),
  weapon('lance', 'Копьё всадника', 'melee', '1d10', 'Колющий', ['Досягаемость', 'Двуручное верхом'], 'topple'),
  weapon('longsword', 'Длинный меч', 'melee', '1d8', 'Рубящий', ['Универсальное (1d10)'], 'sap'),
  weapon('maul', 'Молот', 'melee', '2d6', 'Дробящий', ['Тяжёлое', 'Двуручное'], 'topple'),
  weapon('morningstar', 'Моргенштерн', 'melee', '1d8', 'Колющий', [], 'sap'),
  weapon('pike', 'Пика', 'melee', '1d10', 'Колющий', ['Тяжёлое', 'Досягаемость', 'Двуручное'], 'push'),
  weapon('rapier', 'Рапира', 'melee', '1d8', 'Колющий', ['Финесса'], 'vex'),
  weapon('scimitar', 'Скимитар', 'melee', '1d6', 'Рубящий', ['Лёгкое', 'Финесса'], 'nick'),
  weapon('shortsword', 'Короткий меч', 'melee', '1d6', 'Колющий', ['Лёгкое', 'Финесса'], 'vex'),
  weapon('trident', 'Трезубец', 'melee', '1d8', 'Колющий', ['Метательное (20/60)', 'Универсальное (1d10)'], 'topple'),
  weapon('war-pick', 'Боевой кирк', 'melee', '1d8', 'Колющий', [], 'sap'),
  weapon('warhammer', 'Боевой молот', 'melee', '1d8', 'Дробящий', ['Универсальное (1d10)'], 'push'),
  weapon('whip', 'Кнут', 'melee', '1d4', 'Рубящий', ['Финесса', 'Досягаемость'], 'slow'),
  weapon('dart', 'Дротик', 'ranged', '1d4', 'Колющий', ['Финесса', 'Метательное (20/60)'], 'vex'),
  weapon('light-crossbow', 'Лёгкий арбалет', 'ranged', '1d8', 'Колющий', ['Боеприпасы (80/320)', 'Перезарядка', 'Двуручное'], 'slow'),
  weapon('sling', 'Праща', 'ranged', '1d4', 'Дробящий', ['Боеприпасы (30/120)'], 'slow'),
  weapon('blowgun', 'Духовая трубка', 'ranged', '1', 'Колющий', ['Боеприпасы (25/100)', 'Перезарядка'], 'vex'),
  weapon('hand-crossbow', 'Ручной арбалет', 'ranged', '1d6', 'Колющий', ['Боеприпасы (30/120)', 'Лёгкое', 'Перезарядка'], 'vex'),
  weapon('heavy-crossbow', 'Тяжёлый арбалет', 'ranged', '1d10', 'Колющий', ['Боеприпасы (100/400)', 'Тяжёлое', 'Перезарядка', 'Двуручное'], 'push'),
  weapon('longbow', 'Длинный лук', 'ranged', '1d8', 'Колющий', ['Боеприпасы (150/600)', 'Тяжёлое', 'Двуручное'], 'slow'),
  weapon('shortbow', 'Короткий лук', 'ranged', '1d6', 'Колющий', ['Боеприпасы (80/320)', 'Двуручное'], 'vex'),
]

export function getRules2024Weapon(id: string): WeaponDefinition | undefined {
  return RULES_2024_WEAPONS.find((item) => item.id === id)
}

export function isRules2024WeaponId(id: string): boolean {
  return getRules2024Weapon(id) !== undefined
}

export function getRules2024WeaponMastery(id: string): WeaponMasteryDefinition | undefined {
  return RULES_2024_WEAPON_MASTERIES.find((item) => item.id === id)
}

export function isRules2024WeaponMasteryId(id: string): boolean {
  return getRules2024WeaponMastery(id) !== undefined
}
