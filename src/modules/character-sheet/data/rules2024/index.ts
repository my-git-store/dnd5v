import type { AbilityKey } from '../../types/character.ts'
import type { ClassDefinition, FeatureDefinition, FeatDefinition, RuleChoice, RuleFeatureMetadata, RulesetTaggedDefinition, SpellProgressionType } from '../../types/rules.ts'
import type { Dnd5eEquipmentOption } from '../dnd5eOptions.ts'
import { classIconFor } from '../classIcons.ts'

export interface Rules2024Species extends RulesetTaggedDefinition {
  ruleset: '2024'
  name: string
  label: string
  size: 'Малый' | 'Средний'
  speed: number
  traits: string[]
  languages: string[]
  description: string
  choices: RuleChoice[]
}

export interface Rules2024Background {
  id: string
  ruleset: '2024'
  name: string
  label: string
  description: string
  abilityOptions: AbilityKey[]
  skillProficiencies: string[]
  toolProficiencies: string[]
  languages: string[]
  originFeatId: string
  feature: string
  equipmentOptions: Dnd5eEquipmentOption[]
  choices: RuleChoice[]
}

export interface Rules2024Class extends ClassDefinition {
  ruleset: '2024'
  label: string
  hitDie: string
  primaryAbility: AbilityKey
  spellcastingAbility: AbilityKey | null
  spellProgressionType: SpellProgressionType
  savingThrowKeys: AbilityKey[]
  skillChoiceCount: number
  skillOptions: string[]
  features: string[]
  proficiencies: string[]
  equipmentOptions: Dnd5eEquipmentOption[]
}

export interface Rules2024OriginFeat extends FeatDefinition {
  ruleset: '2024'
  category: 'origin'
  label: string
}

const speciesChoice = (id: string, label: string, description: string, options: string[]): RuleChoice => ({
  id,
  kind: 'trait',
  label,
  description,
  options,
  minSelections: 1,
  maxSelections: 1,
})

const backgroundAbilityChoice = (options: AbilityKey[]): RuleChoice => ({
  id: 'ability-scores',
  kind: 'ability',
  label: 'Бонусы характеристик',
  description: 'Выберите три доступные характеристики: одна получает +2, две другие — +1.',
  options: [...options],
  minSelections: Math.min(3, options.length),
  maxSelections: Math.min(3, options.length),
})

function species(value: Omit<Rules2024Species, 'ruleset' | 'name' | 'choices'> & { choices?: RuleChoice[] }): Rules2024Species {
  return { ...value, ruleset: '2024', name: value.label, choices: value.choices ?? [] }
}

const kit = (id: string, label: string, items: Dnd5eEquipmentOption['items']): Dnd5eEquipmentOption => ({ id, label, items })
const gold = (id: string): Dnd5eEquipmentOption => kit(id, '50 зм вместо набора', [{ name: 'Золотые монеты', quantity: 50, description: 'Стартовые деньги по правилам 2024.', properties: ['currency'] }])

const ORIGIN_FEAT_RECORDS: Array<Pick<Rules2024OriginFeat, 'id' | 'label' | 'description' | 'source'>> = [
  { id: 'alert', label: 'Бдительный', description: 'Быстро реагирует на опасность и помогает группе не терять инициативу.', source: 'background' },
  { id: 'crafter', label: 'Ремесленник', description: 'Владение ремеслом и скидка на обычные предметы.', source: 'background' },
  { id: 'healer', label: 'Лекарь', description: 'Позволяет эффективнее восстанавливать хиты союзникам.', source: 'background' },
  { id: 'lucky', label: 'Удачливый', description: 'Позволяет влиять на отдельные броски к20.', source: 'background' },
  { id: 'magic-initiate-cleric', label: 'Посвящённый в магию: жрец', description: 'Даёт заговоры и заклинание из списка жреца.', source: 'background' },
  { id: 'magic-initiate-druid', label: 'Посвящённый в магию: друид', description: 'Даёт заговоры и заклинание из списка друида.', source: 'background' },
  { id: 'magic-initiate-wizard', label: 'Посвящённый в магию: волшебник', description: 'Даёт заговоры и заклинание из списка волшебника.', source: 'background' },
  { id: 'musician', label: 'Музыкант', description: 'Позволяет поддерживать союзников музыкой во время отдыха.', source: 'background' },
  { id: 'savage-attacker', label: 'Драчун', description: 'Улучшает один бросок урона рукопашной атаки в ход.', source: 'background' },
  { id: 'skilled', label: 'Одарённый', description: 'Даёт владение дополнительными навыками или инструментами.', source: 'background' },
  { id: 'tough', label: 'Крепкий', description: 'Увеличивает максимум хитов.', source: 'background' },
]

export const RULES_2024_FEATS: Rules2024OriginFeat[] = ORIGIN_FEAT_RECORDS.map((feat) => ({
  ...feat,
  ruleset: '2024',
  name: feat.label,
  category: 'origin',
  prerequisites: [],
  effectsMetadata: [{ type: 'feature', source: feat.id }],
}))

export const RULES_2024_SPECIES: Rules2024Species[] = [
  species({ id: 'aasimar', label: 'Аасимар', size: 'Средний', speed: 30, traits: ['Тёмное зрение 60 фт.', 'Небесное сопротивление', 'Исцеляющие руки', 'Носитель света', 'Откровение Небес с 3 уровня'], languages: ['Общий'], description: 'Гуманоид с искрой Верхних планов.', choices: [speciesChoice('celestial-revelation', 'Небесное откровение', 'Выберите форму откровения, доступную с 3 уровня.', ['Сияющая душа', 'Сияющее потребление', 'Некротический покров'])] }),
  species({ id: 'gnome', label: 'Гном', size: 'Малый', speed: 30, traits: ['Тёмное зрение 60 фт.', 'Гномья хитрость', 'Гномье происхождение'], languages: ['Общий', 'Гномий'], description: 'Малый народ с врождённой магией и любопытством.' }),
  species({ id: 'goliath', label: 'Голиаф', size: 'Средний', speed: 35, traits: ['Великанье происхождение', 'Большая форма с 5 уровня', 'Мощное телосложение'], languages: ['Общий', 'Великанский'], description: 'Потомок великанов с необычайной физической силой.', choices: [speciesChoice('giant-ancestry', 'Великанское происхождение', 'Выберите наследие великана для будущего применения правил.', ['Облачный великан', 'Огненный великан', 'Морозный великан', 'Холмовой великан', 'Каменный великан', 'Штормовой великан'])] }),
  species({ id: 'dwarf', label: 'Дварф', size: 'Средний', speed: 30, traits: ['Тёмное зрение 120 фт.', 'Дварфийская стойкость', 'Дварфийская выдержка', 'Знание камня'], languages: ['Общий', 'Дварфийский'], description: 'Стойкий народ камня и подземных крепостей.' }),
  species({ id: 'dragonborn', label: 'Драконорождённый', size: 'Средний', speed: 30, traits: ['Наследие драконов', 'Дыхание дракона', 'Сопротивление урону', 'Драконий полёт с 5 уровня'], languages: ['Общий', 'Драконий'], description: 'Гуманоид с драконьим наследием и оружием дыхания.', choices: [speciesChoice('draconic-ancestry', 'Драконье происхождение', 'Выберите драконье происхождение; его механика будет подключена отдельным rules layer.', ['Чёрный', 'Синий', 'Латунный', 'Бронзовый', 'Медный', 'Золотой', 'Зелёный', 'Красный', 'Серебряный', 'Белый'])] }),
  species({ id: 'orc', label: 'Орк', size: 'Средний', speed: 30, traits: ['Всплеск адреналина', 'Тёмное зрение 120 фт.', 'Непоколебимая стойкость'], languages: ['Общий', 'Орочий'], description: 'Выносливый странник с силой Груумша.' }),
  species({ id: 'halfling', label: 'Полурослик', size: 'Малый', speed: 30, traits: ['Храбрый', 'Проворство полуросликов', 'Везучий', 'Естественная скрытность'], languages: ['Общий', 'Полуросличий'], description: 'Небольшой народ, известный храбростью и удачей.' }),
  species({ id: 'human', label: 'Человек', size: 'Средний', speed: 30, traits: ['Находчивость', 'Умелость', 'Универсальность'], languages: ['Общий'], description: 'Разносторонний народ с дополнительным навыком и чертой.' }),
  species({ id: 'tiefling', label: 'Тифлинг', size: 'Средний', speed: 30, traits: ['Тёмное зрение 60 фт.', 'Происхождение исчадия', 'Потустороннее присутствие'], languages: ['Общий', 'Инфернальный'], description: 'Гуманоид с наследием Нижних планов.', choices: [speciesChoice('fiendish-legacy', 'Исчадное наследие', 'Выберите наследие исчадия; конкретные эффекты применит будущий rules layer.', ['Бездны', 'Хтоническое', 'Инфернальное'])] }),
  species({ id: 'elf', label: 'Эльф', size: 'Средний', speed: 30, traits: ['Тёмное зрение 60 фт.', 'Происхождения эльфов', 'Наследие фей', 'Обострённые чувства', 'Транс'], languages: ['Общий', 'Эльфийский'], description: 'Долгоживущий народ с фейской магией.', choices: [speciesChoice('elven-lineage', 'Эльфийское наследие', 'Выберите наследие эльфов.', ['Дроу', 'Высший эльф', 'Лесной эльф'])] }),
]

const classEquipment: Record<string, Dnd5eEquipmentOption[]> = {
  barbarian: [kit('barbarian-2024', 'Боевой набор', [{ name: 'Боевой топор', quantity: 1, description: '' }, { name: 'Ручной топор', quantity: 4, description: '' }, { name: 'Путевой набор', quantity: 1, description: '' }]), gold('barbarian-gold')],
  bard: [kit('bard-2024', 'Набор барда', [{ name: 'Рапира', quantity: 1, description: '' }, { name: 'Лютня', quantity: 1, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }]), gold('bard-gold')],
  cleric: [kit('cleric-2024', 'Набор жреца', [{ name: 'Булава', quantity: 1, description: '' }, { name: 'Щит', quantity: 1, description: '' }, { name: 'Священный символ', quantity: 1, description: '' }]), gold('cleric-gold')],
  druid: [kit('druid-2024', 'Набор друида', [{ name: 'Щит', quantity: 1, description: '' }, { name: 'Серп', quantity: 1, description: '' }, { name: 'Друидический фокус', quantity: 1, description: '' }]), gold('druid-gold')],
  fighter: [kit('fighter-2024', 'Набор воина', [{ name: 'Длинный меч', quantity: 1, description: '' }, { name: 'Щит', quantity: 1, description: '' }, { name: 'Кольчуга', quantity: 1, description: '' }]), kit('fighter-ranged-2024', 'Дальний бой', [{ name: 'Длинный лук', quantity: 1, description: '' }, { name: 'Колчан стрел', quantity: 20, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }]), gold('fighter-gold')],
  monk: [kit('monk-2024', 'Набор монаха', [{ name: 'Боевой посох', quantity: 1, description: '' }, { name: 'Дротики', quantity: 10, description: '' }]), gold('monk-gold')],
  paladin: [kit('paladin-2024', 'Набор паладина', [{ name: 'Длинный меч', quantity: 1, description: '' }, { name: 'Щит', quantity: 1, description: '' }, { name: 'Кольчуга', quantity: 1, description: '' }]), gold('paladin-gold')],
  ranger: [kit('ranger-2024', 'Набор следопыта', [{ name: 'Длинный лук', quantity: 1, description: '' }, { name: 'Колчан стрел', quantity: 20, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }]), gold('ranger-gold')],
  rogue: [kit('rogue-2024', 'Набор плута', [{ name: 'Рапира', quantity: 1, description: '' }, { name: 'Короткий лук', quantity: 1, description: '' }, { name: 'Воровские инструменты', quantity: 1, description: '' }]), gold('rogue-gold')],
  sorcerer: [kit('sorcerer-2024', 'Набор чародея', [{ name: 'Лёгкий арбалет', quantity: 1, description: '' }, { name: 'Чародейский фокус', quantity: 1, description: '' }]), gold('sorcerer-gold')],
  warlock: [kit('warlock-2024', 'Набор колдуна', [{ name: 'Лёгкий арбалет', quantity: 1, description: '' }, { name: 'Магический фокус', quantity: 1, description: '' }, { name: 'Кожаная броня', quantity: 1, description: '' }]), gold('warlock-gold')],
  wizard: [kit('wizard-2024', 'Набор волшебника', [{ name: 'Боевой посох', quantity: 1, description: '' }, { name: 'Книга заклинаний', quantity: 1, description: '' }, { name: 'Компонентная сумка', quantity: 1, description: '' }]), gold('wizard-gold')],
}

const backgroundEquipment = (id: string, label: string, item: string): Dnd5eEquipmentOption[] => [kit(id, label, [{ name: item, quantity: 1, description: '' }]), gold(`${id}-gold`)]

type Rules2024BackgroundRecord = Omit<Rules2024Background, 'ruleset' | 'name' | 'choices'>

const RULES_2024_BACKGROUND_RECORDS: Rules2024BackgroundRecord[] = [
  { id: 'artist-2024', label: 'Артист', description: 'Выступления и ярмарки стали вашей школой жизни.', abilityOptions: ['strength', 'dexterity', 'charisma'], skillProficiencies: ['acrobatics', 'performance'], toolProficiencies: ['Музыкальный инструмент'], languages: [], originFeatId: 'musician', feature: 'Музыкант', equipmentOptions: backgroundEquipment('artist-kit', 'Набор артиста', 'Музыкальный инструмент') },
  { id: 'noble-2024', label: 'Благородный', description: 'Воспитание при дворе научило вас лидерству и ответственности.', abilityOptions: ['strength', 'intelligence', 'charisma'], skillProficiencies: ['history', 'persuasion'], toolProficiencies: ['Игровой набор'], languages: [], originFeatId: 'skilled', feature: 'Одарённый', equipmentOptions: backgroundEquipment('noble-kit-2024', 'Набор знати', 'Парадная одежда') },
  { id: 'sailor-2024', label: 'Моряк', description: 'Море, штормы и порты закалили вас.', abilityOptions: ['strength', 'dexterity', 'wisdom'], skillProficiencies: ['acrobatics', 'perception'], toolProficiencies: ['Инструменты навигатора'], languages: [], originFeatId: 'savage-attacker', feature: 'Драчун', equipmentOptions: backgroundEquipment('sailor-kit', 'Набор моряка', 'Инструменты навигатора') },
  { id: 'sage-2024', label: 'Мудрец', description: 'Вы провели годы среди библиотек и свитков.', abilityOptions: ['constitution', 'intelligence', 'wisdom'], skillProficiencies: ['arcana', 'history'], toolProficiencies: ['Инструменты каллиграфа'], languages: [], originFeatId: 'magic-initiate-wizard', feature: 'Посвящённый в магию', equipmentOptions: backgroundEquipment('sage-kit-2024', 'Набор мудреца', 'Книга знаний') },
  { id: 'hermit-2024', label: 'Отшельник', description: 'Уединение позволило вам изучить тайны мира.', abilityOptions: ['constitution', 'wisdom', 'charisma'], skillProficiencies: ['medicine', 'religion'], toolProficiencies: ['Набор травника'], languages: [], originFeatId: 'healer', feature: 'Лекарь', equipmentOptions: backgroundEquipment('hermit-kit-2024', 'Набор отшельника', 'Набор травника') },
  { id: 'scribe-2024', label: 'Писарь', description: 'Вы сохраняли знания в скриптории или архиве.', abilityOptions: ['dexterity', 'intelligence', 'wisdom'], skillProficiencies: ['investigation', 'perception'], toolProficiencies: ['Инструменты каллиграфа'], languages: [], originFeatId: 'skilled', feature: 'Одарённый', equipmentOptions: backgroundEquipment('scribe-kit-2024', 'Набор писаря', 'Инструменты каллиграфа') },
  { id: 'acolyte-2024', label: 'Послушник', description: 'Вы служили в храме и изучали священные обряды.', abilityOptions: ['intelligence', 'wisdom', 'charisma'], skillProficiencies: ['insight', 'religion'], toolProficiencies: ['Инструменты каллиграфа'], languages: [], originFeatId: 'magic-initiate-cleric', feature: 'Посвящённый в магию', equipmentOptions: backgroundEquipment('acolyte-kit-2024', 'Храмовый набор', 'Священный символ') },
  { id: 'criminal-2024', label: 'Преступник', description: 'Переулки и гильдии научили вас осторожности.', abilityOptions: ['dexterity', 'constitution', 'intelligence'], skillProficiencies: ['sleight-of-hand', 'stealth'], toolProficiencies: ['Воровские инструменты'], languages: [], originFeatId: 'alert', feature: 'Бдительный', equipmentOptions: backgroundEquipment('criminal-kit-2024', 'Набор преступника', 'Воровские инструменты') },
  { id: 'guide-2024', label: 'Путешественник', description: 'Вы выросли вдали от поселений и знаете дикую местность.', abilityOptions: ['dexterity', 'constitution', 'wisdom'], skillProficiencies: ['stealth', 'survival'], toolProficiencies: ['Инструменты картографа'], languages: [], originFeatId: 'magic-initiate-druid', feature: 'Посвящённый в магию', equipmentOptions: backgroundEquipment('guide-kit-2024', 'Набор проводника', 'Инструменты картографа') },
  { id: 'artisan-2024', label: 'Ремесленник', description: 'Вы освоили ремесло в мастерской.', abilityOptions: ['strength', 'dexterity', 'intelligence'], skillProficiencies: ['investigation', 'persuasion'], toolProficiencies: ['Инструменты ремесленника'], languages: [], originFeatId: 'crafter', feature: 'Ремесленник', equipmentOptions: backgroundEquipment('artisan-kit-2024', 'Набор ремесленника', 'Инструменты ремесленника') },
  { id: 'soldier-2024', label: 'Солдат', description: 'Военная служба сформировала вашу дисциплину.', abilityOptions: ['strength', 'dexterity', 'constitution'], skillProficiencies: ['athletics', 'intimidation'], toolProficiencies: ['Игровой набор'], languages: [], originFeatId: 'savage-attacker', feature: 'Драчун', equipmentOptions: backgroundEquipment('soldier-kit-2024', 'Набор солдата', 'Военная форма') },
  { id: 'guard-2024', label: 'Стражник', description: 'Вы охраняли поселение и следили за порядком.', abilityOptions: ['strength', 'intelligence', 'wisdom'], skillProficiencies: ['athletics', 'perception'], toolProficiencies: ['Игровой набор'], languages: [], originFeatId: 'alert', feature: 'Бдительный', equipmentOptions: backgroundEquipment('guard-kit-2024', 'Набор стражника', 'Фонарь') },
  { id: 'outlander-2024', label: 'Странник', description: 'Дикая местность была вашим домом.', abilityOptions: ['dexterity', 'wisdom', 'charisma'], skillProficiencies: ['insight', 'stealth'], toolProficiencies: ['Воровские инструменты'], languages: [], originFeatId: 'lucky', feature: 'Удачливый', equipmentOptions: backgroundEquipment('outlander-kit-2024', 'Набор странника', 'Одеяло') },
  { id: 'merchant-2024', label: 'Торговец', description: 'Вы знали дороги, рынки и цену каждой сделки.', abilityOptions: ['constitution', 'intelligence', 'charisma'], skillProficiencies: ['animal-handling', 'persuasion'], toolProficiencies: ['Инструменты навигатора'], languages: [], originFeatId: 'lucky', feature: 'Удачливый', equipmentOptions: backgroundEquipment('merchant-kit-2024', 'Торговый набор', 'Весы') },
  { id: 'farmer-2024', label: 'Фермер', description: 'Земля научила вас терпению и крепкому здоровью.', abilityOptions: ['strength', 'constitution', 'wisdom'], skillProficiencies: ['animal-handling', 'nature'], toolProficiencies: ['Инструменты плотника'], languages: [], originFeatId: 'tough', feature: 'Крепкий', equipmentOptions: backgroundEquipment('farmer-kit-2024', 'Набор фермера', 'Серп') },
  { id: 'charlatan-2024', label: 'Шарлатан', description: 'Вы научились наживаться на доверчивых людях.', abilityOptions: ['dexterity', 'constitution', 'charisma'], skillProficiencies: ['deception', 'sleight-of-hand'], toolProficiencies: ['Набор для фальсификации'], languages: [], originFeatId: 'skilled', feature: 'Одарённый', equipmentOptions: backgroundEquipment('charlatan-kit-2024', 'Набор шарлатана', 'Набор для фальсификации') },
]

export const RULES_2024_BACKGROUNDS: Rules2024Background[] = RULES_2024_BACKGROUND_RECORDS.map((value): Rules2024Background => ({ ...value, ruleset: '2024', name: value.label, choices: [backgroundAbilityChoice(value.abilityOptions)] }))

const allSkills = ['acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight-of-hand', 'stealth', 'survival']
const classDescriptions: Record<string, string> = {
  barbarian: 'Свирепый воин, черпающий силу в ярости и первобытной выносливости.',
  bard: 'Вдохновляющий мастер слова, музыки и магии.',
  cleric: 'Избранник божества, соединяющий веру, защиту и чудеса.',
  druid: 'Хранитель природы, владеющий силами зверей и стихий.',
  fighter: 'Универсальный мастер оружия и боевых техник.',
  monk: 'Дисциплинированный воин, направляющий тело и дух.',
  paladin: 'Защитник клятвы, сражающийся во имя идеалов.',
  ranger: 'Следопыт и охотник, соединяющий боевое мастерство с природной магией.',
  rogue: 'Ловкий специалист по скрытности, точным ударам и уловкам.',
  sorcerer: 'Носитель врождённой магии, управляющий силой происхождения.',
  warlock: 'Заклинатель, получивший силу через договор с потусторонним покровителем.',
  wizard: 'Учёный маг, постигающий заклинания через исследование и практику.',
}

const spellProgressionFor = (id: string, spellcastingAbility: AbilityKey | null): SpellProgressionType => {
  if (!spellcastingAbility) return 'none'
  if (id === 'warlock') return 'pact'
  if (id === 'bard' || id === 'ranger' || id === 'sorcerer') return 'known'
  return 'prepared'
}

const splitProficiencies = (proficiencies: string[]): { weapon: string[]; armor: string[] } => {
  const weaponPattern = /оруж|меч|рапир|топор|арбалет|лук|кинжал|дротик|пращ|посох|дубин|серп/i
  const armorPattern = /брон|щит/i
  return {
    weapon: proficiencies.filter((value) => weaponPattern.test(value)),
    armor: proficiencies.filter((value) => armorPattern.test(value)),
  }
}

const classData = (id: string, label: string, hitDie: string, primaryAbility: AbilityKey, spellcastingAbility: AbilityKey | null, savingThrowKeys: AbilityKey[], skillChoiceCount: number, skillOptions: string[], features: string[], proficiencies: string[]): Rules2024Class => {
  const equipmentOptions = classEquipment[id] ?? [gold(`${id}-gold`)]
  const split = splitProficiencies(proficiencies)
  const levelFeaturesMetadata: RuleFeatureMetadata[] = features.map((feature, index) => ({ id: `${id}.level-1.${index + 1}`, level: 1, label: feature }))
  return {
    id, ruleset: '2024', name: label, label, icon: classIconFor(id), description: classDescriptions[id] ?? `${label}: класс первого уровня D&D 2024.`, hitDie,
    primaryAbility, primaryAbilities: [primaryAbility], spellcastingAbility, spellProgressionType: spellProgressionFor(id, spellcastingAbility),
    savingThrowKeys, savingThrowProficiencies: [...savingThrowKeys], skillChoiceCount, skillOptions, skillChoices: { count: skillChoiceCount, options: [...skillOptions] },
    features, proficiencies, weaponProficiencies: split.weapon, armorProficiencies: split.armor, equipmentOptions,
    startingEquipment: equipmentOptions, levelFeaturesMetadata, featureIds: levelFeaturesMetadata.map((feature) => feature.id),
  }
}

export const RULES_2024_CLASSES: Rules2024Class[] = [
  classData('barbarian', 'Варвар', 'd12', 'strength', null, ['strength', 'constitution'], 2, ['animal-handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], ['Ярость', 'Защита без доспехов'], ['Простое и воинское оружие', 'Лёгкая и средняя броня, щиты']),
  classData('bard', 'Бард', 'd8', 'charisma', 'charisma', ['dexterity', 'charisma'], 3, allSkills, ['Бардовское вдохновение', 'Колдовство'], ['Лёгкая броня', 'Три музыкальных инструмента']),
  classData('cleric', 'Жрец', 'd8', 'wisdom', 'wisdom', ['wisdom', 'charisma'], 2, ['history', 'insight', 'medicine', 'persuasion', 'religion'], ['Колдовство', 'Божественный порядок'], ['Лёгкая и средняя броня, щиты', 'Простое оружие']),
  classData('druid', 'Друид', 'd8', 'wisdom', 'wisdom', ['intelligence', 'wisdom'], 2, ['arcana', 'animal-handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], ['Друидический язык', 'Колдовство'], ['Лёгкая и средняя броня, щиты']),
  classData('fighter', 'Воин', 'd10', 'strength', null, ['strength', 'constitution'], 2, ['acrobatics', 'animal-handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], ['Боевой стиль', 'Второе дыхание', 'Оружейное мастерство'], ['Вся броня, щиты', 'Простое и воинское оружие']),
  classData('monk', 'Монах', 'd8', 'dexterity', null, ['strength', 'dexterity'], 2, ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], ['Боевые искусства', 'Защита без доспехов'], ['Простое оружие', 'Короткие мечи']),
  classData('paladin', 'Паладин', 'd10', 'strength', 'charisma', ['wisdom', 'charisma'], 2, ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], ['Божественное чувство', 'Наложение рук'], ['Вся броня, щиты', 'Простое и воинское оружие']),
  classData('ranger', 'Следопыт', 'd10', 'dexterity', 'wisdom', ['strength', 'dexterity'], 3, ['animal-handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], ['Избранный враг', 'Колдовство'], ['Лёгкая и средняя броня, щиты', 'Простое и воинское оружие']),
  classData('rogue', 'Плут', 'd8', 'dexterity', null, ['dexterity', 'intelligence'], 4, ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight-of-hand', 'stealth'], ['Экспертиза', 'Скрытая атака', 'Воровской жаргон'], ['Лёгкая броня', 'Простое оружие, рапиры и короткие мечи']),
  classData('sorcerer', 'Чародей', 'd6', 'charisma', 'charisma', ['constitution', 'charisma'], 2, ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], ['Колдовство', 'Врождённое колдовство'], ['Кинжалы, дротики, пращи, боевые посохи, лёгкие арбалеты']),
  classData('warlock', 'Колдун', 'd8', 'charisma', 'charisma', ['wisdom', 'charisma'], 2, ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], ['Магия договора', 'Мистические воззвания'], ['Лёгкая броня', 'Простое оружие']),
  classData('wizard', 'Волшебник', 'd6', 'intelligence', 'intelligence', ['intelligence', 'wisdom'], 2, ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'], ['Колдовство', 'Восстановление волшебства'], ['Кинжалы, дротики, пращи, боевые посохи, лёгкие арбалеты']),
]

/**
 * Feature references are derived from the class metadata above. Keeping this catalogue
 * generated avoids copying class feature content into a second source of truth.
 */
export const RULES_2024_FEATURES: FeatureDefinition[] = RULES_2024_CLASSES.flatMap((classDefinition) => classDefinition.levelFeaturesMetadata.map((feature) => ({
  id: feature.id,
  ruleset: '2024' as const,
  name: feature.label,
  description: `${feature.label} — метаданные способности ${feature.level} уровня класса «${classDefinition.name}».`,
  source: 'class' as const,
  category: 'class' as const,
  prerequisites: [],
  level: feature.level,
  classId: classDefinition.id,
  metadata: { referenceOnly: true },
})))

export function getSpecies2024(id: string): Rules2024Species | undefined { return RULES_2024_SPECIES.find((item) => item.id === id) }
export function isSpecies2024Id(id: string): boolean { return getSpecies2024(id) !== undefined }
export function findSpecies2024(id: string): Rules2024Species { return getSpecies2024(id) ?? RULES_2024_SPECIES[0]! }
export function getRules2024Class(id: string): Rules2024Class | undefined { return RULES_2024_CLASSES.find((item) => item.id === id) }
export function isRules2024ClassId(id: string): boolean { return getRules2024Class(id) !== undefined }
export function findRules2024Class(id: string): Rules2024Class { return RULES_2024_CLASSES.find((item) => item.id === id) ?? RULES_2024_CLASSES[0]! }
export function getRules2024Feature(id: string): FeatureDefinition | undefined { return RULES_2024_FEATURES.find((item) => item.id === id) }
export function isRules2024FeatureId(id: string): boolean { return getRules2024Feature(id) !== undefined }
export function getRules2024ClassFeatures(classId: string, level?: number): FeatureDefinition[] {
  const classDefinition = getRules2024Class(classId)
  if (!classDefinition) return []
  const maxLevel = level ?? Number.POSITIVE_INFINITY
  return (classDefinition.featureIds ?? classDefinition.levelFeaturesMetadata.map((feature) => feature.id))
    .map((id) => getRules2024Feature(id))
    .filter((feature): feature is FeatureDefinition => feature !== undefined && feature.level <= maxLevel)
}
export function getRules2024Background(id: string): Rules2024Background | undefined { return RULES_2024_BACKGROUNDS.find((item) => item.id === id) }
export function isBackground2024Id(id: string): boolean { return getRules2024Background(id) !== undefined }
export function findRules2024Background(id: string): Rules2024Background { return getRules2024Background(id) ?? RULES_2024_BACKGROUNDS[0]! }
export function getRules2024Feat(id: string): Rules2024OriginFeat | undefined { return RULES_2024_FEATS.find((item) => item.id === id) }
export function isRules2024FeatId(id: string): boolean { return getRules2024Feat(id) !== undefined }
export function findRules2024Feat(id: string): Rules2024OriginFeat { return getRules2024Feat(id) ?? RULES_2024_FEATS[0]! }

export {
  RULES_2024_WEAPON_MASTERIES,
  RULES_2024_WEAPONS,
  getRules2024Weapon,
  getRules2024WeaponMastery,
  isRules2024WeaponId,
  isRules2024WeaponMasteryId,
} from './weapons.ts'

export {
  RULES_2024_SPELLS,
  getRules2024Spell,
  getRules2024SpellsForClass,
  getRules2024CantripsForClass,
  isRules2024SpellId,
} from './spells.ts'
