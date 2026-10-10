import type { AbilityKey, CharacterGender } from '../types/character.ts'
import type { BackgroundProfileV3, CharacterProficiencyV3, RaceProfileV3 } from '../types/characterV3.ts'
import type { SpellProgressionType } from '../types/rules.ts'
import { classIconFor, classIconVariantsFor } from './classIcons.ts'

export interface Dnd5eRaceOption {
  id: string
  label: string
  profile: RaceProfileV3
  skillProficiencies?: string[]
  skillChoices?: { count: number; options: string[] }
  abilityChoices?: { count: number; bonus: number; options: AbilityKey[] }
}

export interface Dnd5eSubraceOption {
  id: string
  raceId: string
  label: string
  description: string
  abilityBonuses: Partial<Record<AbilityKey, number>>
  traits: string[]
  languages?: string[]
  skillProficiencies?: string[]
}

export interface Dnd5eEquipmentOption {
  id: string
  label: string
  items: Array<{ name: string; quantity: number; description: string; weight?: number | null; properties?: string[] }>
}

export interface Dnd5eBackgroundOption {
  id: string
  label: string
  description: string
  skillProficiencies: string[]
  toolProficiencies: string[]
  languages: string[]
  feature: string
  equipmentOptions: Dnd5eEquipmentOption[]
}

export interface Dnd5eClassOption {
  id: string
  label: string
  icon?: string
  iconByGender?: Partial<Record<CharacterGender, string>>
  /** Optional canonical 2024 metadata; legacy class options keep the old shape. */
  description?: string
  hitDie: string
  primaryAbility: AbilityKey
  primaryAbilities?: AbilityKey[]
  spellcastingAbility: AbilityKey | null
  spellProgressionType?: SpellProgressionType
  savingThrowKeys: AbilityKey[]
  savingThrowProficiencies?: AbilityKey[]
  skillChoiceCount: number
  skillOptions: string[]
  skillChoices?: { count: number; options: string[] }
  features: string[]
  proficiencies: string[]
  weaponProficiencies?: string[]
  armorProficiencies?: string[]
  equipmentOptions?: Dnd5eEquipmentOption[]
  startingEquipment?: Dnd5eEquipmentOption[]
}

const ALL_SKILLS = ['acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival']

export const DND5E_RACES: Dnd5eRaceOption[] = [
  {
    id: 'human', label: 'Человек',
    profile: { name: 'Человек', subrace: '', size: 'Средний', speed: 30, abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 }, traits: ['Универсальность: +1 к каждой характеристике'], languages: ['Общий', 'Один дополнительный язык'] },
  },
  {
    id: 'dwarf', label: 'Дварф',
    profile: { name: 'Дварф', subrace: '', size: 'Средний', speed: 25, abilityBonuses: { constitution: 2 }, traits: ['Тёмное зрение 60 фт.', 'Дварфская стойкость', 'Дварфское боевое обучение', 'Каменная смекалка'], languages: ['Общий', 'Дварфийский'] },
  },
  {
    id: 'elf', label: 'Эльф',
    profile: { name: 'Эльф', subrace: '', size: 'Средний', speed: 30, abilityBonuses: { dexterity: 2 }, traits: ['Тёмное зрение 60 фт.', 'Обострённые чувства', 'Фейское происхождение', 'Транс'], languages: ['Общий', 'Эльфийский'] }, skillProficiencies: ['perception'],
  },
  {
    id: 'halfling', label: 'Полурослик',
    profile: { name: 'Полурослик', subrace: '', size: 'Маленький', speed: 25, abilityBonuses: { dexterity: 2 }, traits: ['Везучий', 'Храбрый', 'Проворство полурослика'], languages: ['Общий', 'Полуросличий'] },
  },
  {
    id: 'dragonborn', label: 'Драконорождённый',
    profile: { name: 'Драконорождённый', subrace: '', size: 'Средний', speed: 30, abilityBonuses: { strength: 2, charisma: 1 }, traits: ['Драконье происхождение', 'Дыхание дракона', 'Сопротивление урону'], languages: ['Общий', 'Драконий'] },
  },
  {
    id: 'gnome', label: 'Гном',
    profile: { name: 'Гном', subrace: '', size: 'Маленький', speed: 25, abilityBonuses: { intelligence: 2 }, traits: ['Тёмное зрение 60 фт.', 'Гномья хитрость'], languages: ['Общий', 'Гномий'] },
  },
  {
    id: 'half-elf', label: 'Полуэльф',
    profile: { name: 'Полуэльф', subrace: '', size: 'Средний', speed: 30, abilityBonuses: { charisma: 2 }, traits: ['Тёмное зрение 60 фт.', 'Фейское происхождение', 'Многоликость'], languages: ['Общий', 'Эльфийский', 'Один дополнительный язык'] }, skillChoices: { count: 2, options: ALL_SKILLS },
    abilityChoices: { count: 2, bonus: 1, options: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom'] },
  },
  {
    id: 'half-orc', label: 'Полуорк',
    profile: { name: 'Полуорк', subrace: '', size: 'Средний', speed: 30, abilityBonuses: { strength: 2, constitution: 1 }, traits: ['Тёмное зрение 60 фт.', 'Устрашающий вид', 'Непоколебимая стойкость', 'Свирепые атаки'], languages: ['Общий', 'Орочий'] }, skillProficiencies: ['intimidation'],
  },
  {
    id: 'tiefling', label: 'Тифлинг',
    profile: { name: 'Тифлинг', subrace: '', size: 'Средний', speed: 30, abilityBonuses: { intelligence: 1, charisma: 2 }, traits: ['Тёмное зрение 60 фт.', 'Адское сопротивление', 'Адское наследие'], languages: ['Общий', 'Инфернальный'] },
  },
]

export const DND5E_CLASSES: Dnd5eClassOption[] = [
  { id: 'barbarian', label: 'Варвар', hitDie: 'd12', primaryAbility: 'strength', spellcastingAbility: null, savingThrowKeys: ['strength', 'constitution'], skillChoiceCount: 2, skillOptions: ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], features: ['Ярость', 'Защита без доспехов'], proficiencies: ['Простое и воинское оружие', 'Лёгкая и средняя броня, щиты'] },
  { id: 'bard', label: 'Бард', hitDie: 'd8', primaryAbility: 'charisma', spellcastingAbility: 'charisma', savingThrowKeys: ['dexterity', 'charisma'], skillChoiceCount: 3, skillOptions: ALL_SKILLS, features: ['Колдовство', 'Вдохновение барда'], proficiencies: ['Лёгкая броня', 'Три музыкальных инструмента', 'Любые три навыка'] },
  { id: 'cleric', label: 'Жрец', hitDie: 'd8', primaryAbility: 'wisdom', spellcastingAbility: 'wisdom', savingThrowKeys: ['wisdom', 'charisma'], skillChoiceCount: 2, skillOptions: ['history', 'insight', 'medicine', 'persuasion', 'religion'], features: ['Колдовство', 'Божественный домен'], proficiencies: ['Лёгкая и средняя броня, щиты', 'Простое оружие'] },
  { id: 'druid', label: 'Друид', hitDie: 'd8', primaryAbility: 'wisdom', spellcastingAbility: 'wisdom', savingThrowKeys: ['intelligence', 'wisdom'], skillChoiceCount: 2, skillOptions: ['arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], features: ['Друидический язык', 'Колдовство'], proficiencies: ['Лёгкая и средняя броня (неметаллическая)', 'Щиты (неметаллические)', 'Дубинка, серп и простое оружие'] },
  { id: 'fighter', label: 'Воин', hitDie: 'd10', primaryAbility: 'strength', spellcastingAbility: null, savingThrowKeys: ['strength', 'constitution'], skillChoiceCount: 2, skillOptions: ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], features: ['Боевой стиль', 'Второе дыхание'], proficiencies: ['Вся броня, щиты', 'Простое и воинское оружие'] },
  { id: 'monk', label: 'Монах', hitDie: 'd8', primaryAbility: 'dexterity', spellcastingAbility: null, savingThrowKeys: ['strength', 'dexterity'], skillChoiceCount: 2, skillOptions: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], features: ['Защита без доспехов', 'Боевые искусства'], proficiencies: ['Простое оружие', 'Короткие мечи'] },
  { id: 'paladin', label: 'Паладин', hitDie: 'd10', primaryAbility: 'strength', spellcastingAbility: null, savingThrowKeys: ['wisdom', 'charisma'], skillChoiceCount: 2, skillOptions: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], features: ['Божественное чувство', 'Наложение рук'], proficiencies: ['Вся броня, щиты', 'Простое и воинское оружие'] },
  { id: 'ranger', label: 'Следопыт', hitDie: 'd10', primaryAbility: 'dexterity', spellcastingAbility: null, savingThrowKeys: ['strength', 'dexterity'], skillChoiceCount: 3, skillOptions: ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], features: ['Избранный враг', 'Исследователь природы'], proficiencies: ['Лёгкая и средняя броня, щиты', 'Простое и воинское оружие'] },
  { id: 'rogue', label: 'Плут', hitDie: 'd8', primaryAbility: 'dexterity', spellcastingAbility: null, savingThrowKeys: ['dexterity', 'intelligence'], skillChoiceCount: 4, skillOptions: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth'], features: ['Экспертиза', 'Скрытая атака', 'Воровской жаргон'], proficiencies: ['Лёгкая броня', 'Простое оружие, ручные арбалеты, длинные и короткие мечи, рапиры'] },
  { id: 'sorcerer', label: 'Чародей', hitDie: 'd6', primaryAbility: 'charisma', spellcastingAbility: 'charisma', savingThrowKeys: ['constitution', 'charisma'], skillChoiceCount: 2, skillOptions: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], features: ['Колдовство', 'Чародейское происхождение'], proficiencies: ['Кинжалы, дротики, пращи, боевые посохи, лёгкие арбалеты'] },
  { id: 'warlock', label: 'Колдун', hitDie: 'd8', primaryAbility: 'charisma', spellcastingAbility: 'charisma', savingThrowKeys: ['wisdom', 'charisma'], skillChoiceCount: 2, skillOptions: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], features: ['Потусторонний покровитель', 'Магия договора'], proficiencies: ['Лёгкая броня', 'Простое оружие'] },
  { id: 'wizard', label: 'Волшебник', hitDie: 'd6', primaryAbility: 'intelligence', spellcastingAbility: 'intelligence', savingThrowKeys: ['intelligence', 'wisdom'], skillChoiceCount: 2, skillOptions: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], features: ['Колдовство', 'Восстановление волшебства'], proficiencies: ['Кинжалы, дротики, пращи, боевые посохи, лёгкие арбалеты'] },
]

/** PHB subraces kept intentionally small: they are creation choices, not a catalog. */
export const DND5E_SUBRACES: Dnd5eSubraceOption[] = [
  { id: 'hill-dwarf', raceId: 'dwarf', label: 'Холмовой дварф', description: 'Выносливые хранители холмов.', abilityBonuses: { wisdom: 1 }, traits: ['Дварфская выносливость'], languages: [] },
  { id: 'mountain-dwarf', raceId: 'dwarf', label: 'Горный дварф', description: 'Крепкие дварфы горных крепостей.', abilityBonuses: { strength: 2 }, traits: ['Дварфская броня'], languages: [] },
  { id: 'high-elf', raceId: 'elf', label: 'Высший эльф', description: 'Учёные и искусные маги эльфийских городов.', abilityBonuses: { intelligence: 1 }, traits: ['Эльфийское боевое обучение', 'Знание магии'], languages: ['Один дополнительный язык'] },
  { id: 'wood-elf', raceId: 'elf', label: 'Лесной эльф', description: 'Быстрые следопыты лесов.', abilityBonuses: { wisdom: 1 }, traits: ['Быстрые ноги', 'Маскировка в природе'], languages: [] },
  { id: 'drow', raceId: 'elf', label: 'Тёмный эльф (дроу)', description: 'Эльфы Подземья с врождённой магией.', abilityBonuses: { charisma: 1 }, traits: ['Высшее тёмное зрение', 'Магия дроу'], languages: [] },
  { id: 'lightfoot', raceId: 'halfling', label: 'Легконогий полурослик', description: 'Общительные и скрытные странники.', abilityBonuses: { charisma: 1 }, traits: ['Природная скрытность'], languages: [] },
  { id: 'stout', raceId: 'halfling', label: 'Коренастый полурослик', description: 'Выносливые полурослики.', abilityBonuses: { constitution: 1 }, traits: ['Коренастая выносливость'], languages: [] },
  { id: 'forest-gnome', raceId: 'gnome', label: 'Лесной гном', description: 'Друзья зверей и иллюзий.', abilityBonuses: { dexterity: 1 }, traits: ['Природный иллюзионист', 'Разговор с маленькими зверями'], languages: [] },
  { id: 'rock-gnome', raceId: 'gnome', label: 'Скальный гном', description: 'Изобретатели и мастера механизмов.', abilityBonuses: { constitution: 1 }, traits: ['Знание механизмов', 'Мастер-ремесленник'], languages: [] },
]

const equipment = (id: string, label: string, items: Dnd5eEquipmentOption['items']): Dnd5eEquipmentOption => ({ id, label, items })

const CLASS_EQUIPMENT: Record<string, Dnd5eEquipmentOption[]> = {
  barbarian: [equipment('barbarian-arms', 'Боевой набор', [{ name: 'Боевой топор', quantity: 1, description: '' }, { name: 'Два ручных топора', quantity: 2, description: '' }, { name: 'Путевой набор', quantity: 1, description: '' }]), equipment('barbarian-simple', 'Простой набор', [{ name: 'Два ручных топора', quantity: 2, description: '' }, { name: 'Путевой набор', quantity: 1, description: '' }])],
  bard: [equipment('bard-rapier', 'Набор барда', [{ name: 'Рапира', quantity: 1, description: '' }, { name: 'Лютня', quantity: 1, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }])],
  cleric: [equipment('cleric-mace', 'Набор жреца', [{ name: 'Булава', quantity: 1, description: '' }, { name: 'Щит', quantity: 1, description: '' }, { name: 'Священный символ', quantity: 1, description: '' }])],
  druid: [equipment('druid-scimitar', 'Набор друида', [{ name: 'Скимитар', quantity: 1, description: '' }, { name: 'Деревянный щит', quantity: 1, description: '' }, { name: 'Друидический фокус', quantity: 1, description: '' }])],
  fighter: [equipment('fighter-sword', 'Меч и щит', [{ name: 'Длинный меч', quantity: 1, description: '' }, { name: 'Щит', quantity: 1, description: '' }, { name: 'Кольчуга', quantity: 1, description: '' }]), equipment('fighter-bow', 'Оружие дальнего боя', [{ name: 'Длинный лук', quantity: 1, description: '' }, { name: 'Колчан стрел', quantity: 20, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }])],
  monk: [equipment('monk-staff', 'Набор монаха', [{ name: 'Боевой посох', quantity: 1, description: '' }, { name: 'Дротики', quantity: 10, description: '' }])],
  paladin: [equipment('paladin-sword', 'Набор паладина', [{ name: 'Длинный меч', quantity: 1, description: '' }, { name: 'Щит', quantity: 1, description: '' }, { name: 'Кольчуга', quantity: 1, description: '' }])],
  ranger: [equipment('ranger-bow', 'Набор следопыта', [{ name: 'Длинный лук', quantity: 1, description: '' }, { name: 'Колчан стрел', quantity: 20, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }])],
  rogue: [equipment('rogue-rapier', 'Набор плута', [{ name: 'Рапира', quantity: 1, description: '' }, { name: 'Короткий лук', quantity: 1, description: '' }, { name: 'Воровские инструменты', quantity: 1, description: '' }])],
  sorcerer: [equipment('sorcerer-focus', 'Набор чародея', [{ name: 'Лёгкий арбалет', quantity: 1, description: '' }, { name: 'Чародейский фокус', quantity: 1, description: '' }])],
  warlock: [equipment('warlock-focus', 'Набор колдуна', [{ name: 'Лёгкий арбалет', quantity: 1, description: '' }, { name: 'Магический фокус', quantity: 1, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }])],
  wizard: [equipment('wizard-focus', 'Набор волшебника', [{ name: 'Боевой посох', quantity: 1, description: '' }, { name: 'Книга заклинаний', quantity: 1, description: '' }, { name: 'Компонентная сумка', quantity: 1, description: '' }])],
}

for (const classOption of DND5E_CLASSES) {
  classOption.equipmentOptions = CLASS_EQUIPMENT[classOption.id]
  classOption.icon = classIconFor(classOption.id)
  classOption.iconByGender = classIconVariantsFor(classOption.id)
}

export const DND5E_BACKGROUNDS: Dnd5eBackgroundOption[] = [
  { id: 'acolyte', label: 'Прислужник', description: 'Служитель храма и хранитель обрядов.', skillProficiencies: ['insight', 'religion'], toolProficiencies: [], languages: ['Дополнительный язык 1', 'Дополнительный язык 2'], feature: 'Приют верующих', equipmentOptions: [equipment('acolyte-kit', 'Храмовый набор', [{ name: 'Священный символ', quantity: 1, description: '' }, { name: 'Молитвенник', quantity: 1, description: '' }])] },
  { id: 'criminal', label: 'Преступник', description: 'Выживание в теневом мире научило вас осторожности.', skillProficiencies: ['deception', 'stealth'], toolProficiencies: ['Воровские инструменты', 'Игровой набор'], languages: [], feature: 'Преступный контакт', equipmentOptions: [equipment('criminal-kit', 'Набор преступника', [{ name: 'Ломик', quantity: 1, description: '' }, { name: 'Тёмная одежда', quantity: 1, description: '' }, { name: 'Мешочек', quantity: 1, description: '' }])] },
  { id: 'folk-hero', label: 'Народный герой', description: 'Вы выросли среди простых людей и стали их защитником.', skillProficiencies: ['animal-handling', 'survival'], toolProficiencies: ['Ремесленные инструменты', 'Наземный транспорт'], languages: [], feature: 'Сельское гостеприимство', equipmentOptions: [equipment('folk-hero-kit', 'Набор народного героя', [{ name: 'Ремесленные инструменты', quantity: 1, description: '' }, { name: 'Лопата', quantity: 1, description: '' }, { name: 'Железный горшок', quantity: 1, description: '' }])] },
  { id: 'noble', label: 'Благородный', description: 'Вы привыкли к власти, ответственности и придворным обычаям.', skillProficiencies: ['history', 'persuasion'], toolProficiencies: ['Игровой набор'], languages: ['Дополнительный язык'], feature: 'Положение привилегии', equipmentOptions: [equipment('noble-kit', 'Набор знати', [{ name: 'Изысканная одежда', quantity: 1, description: '' }, { name: 'Перстень-печатка', quantity: 1, description: '' }])] },
  { id: 'sage', label: 'Мудрец', description: 'Годы исследований сделали вас знатоком редких сведений.', skillProficiencies: ['arcana', 'history'], toolProficiencies: [], languages: ['Дополнительный язык 1', 'Дополнительный язык 2'], feature: 'Исследователь', equipmentOptions: [equipment('sage-kit', 'Набор исследователя', [{ name: 'Чернила', quantity: 1, description: '' }, { name: 'Перо', quantity: 1, description: '' }, { name: 'Книга знаний', quantity: 1, description: '' }])] },
  { id: 'soldier', label: 'Солдат', description: 'Военная служба сформировала вашу дисциплину.', skillProficiencies: ['athletics', 'intimidation'], toolProficiencies: ['Наземный транспорт', 'Игровой набор'], languages: [], feature: 'Воинское звание', equipmentOptions: [equipment('soldier-kit', 'Набор солдата', [{ name: 'Военная форма', quantity: 1, description: '' }, { name: 'Знамя', quantity: 1, description: '' }, { name: 'Игровой набор', quantity: 1, description: '' }])] },
  { id: 'urchin', label: 'Беспризорник', description: 'Улица научила вас скрываться и находить выход.', skillProficiencies: ['sleight-of-hand', 'stealth'], toolProficiencies: ['Воровские инструменты', 'Набор маскировки'], languages: [], feature: 'Городские тайны', equipmentOptions: [equipment('urchin-kit', 'Набор беспризорника', [{ name: 'Маленький нож', quantity: 1, description: '' }, { name: 'Карта города', quantity: 1, description: '' }, { name: 'Безделушка', quantity: 1, description: '' }])] },
]

export const EMPTY_BACKGROUND: BackgroundProfileV3 = { name: '', feature: '', skillProficiencies: [], toolProficiencies: [], languages: [], notes: '' }

export function raceProfile(option: Dnd5eRaceOption, bonuses = option.profile.abilityBonuses, subrace?: Dnd5eSubraceOption): RaceProfileV3 {
  return {
    ...option.profile,
    subrace: subrace?.label ?? '',
    abilityBonuses: { ...bonuses },
    traits: [...option.profile.traits, ...(subrace?.traits ?? [])],
    languages: [...option.profile.languages, ...(subrace?.languages ?? [])],
  }
}

export function combinedRaceBonuses(option: Dnd5eRaceOption, choices: AbilityKey[], subrace?: Dnd5eSubraceOption): Partial<Record<AbilityKey, number>> {
  const bonuses = { ...option.profile.abilityBonuses }
  if (option.abilityChoices) {
    for (const key of choices.slice(0, option.abilityChoices.count)) bonuses[key] = (bonuses[key] ?? 0) + option.abilityChoices.bonus
  }
  for (const [key, amount] of Object.entries(subrace?.abilityBonuses ?? {})) bonuses[key as AbilityKey] = (bonuses[key as AbilityKey] ?? 0) + amount
  return bonuses
}

export function findRace(id: string): Dnd5eRaceOption { return DND5E_RACES.find((race) => race.id === id) ?? DND5E_RACES[0]! }
export function findClass(id: string): Dnd5eClassOption { return DND5E_CLASSES.find((item) => item.id === id) ?? DND5E_CLASSES[DND5E_CLASSES.length - 1]! }
export function findSubrace(raceId: string, id?: string): Dnd5eSubraceOption | undefined { return DND5E_SUBRACES.find((item) => item.raceId === raceId && item.id === id) }
export function subracesForRace(raceId: string): Dnd5eSubraceOption[] { return DND5E_SUBRACES.filter((item) => item.raceId === raceId) }
export function findBackground(id?: string): Dnd5eBackgroundOption { return DND5E_BACKGROUNDS.find((item) => item.id === id) ?? DND5E_BACKGROUNDS[0]! }
export function proficiencyForCreation(classOption: Dnd5eClassOption, race: Dnd5eRaceOption): CharacterProficiencyV3 {
  return { toolProficiencies: [...classOption.proficiencies], languageProficiencies: [...race.profile.languages] }
}
