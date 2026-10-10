import type { SpellDefinition } from '../../types/rules.ts'

const spell = (
  id: string,
  name: string,
  level: number,
  school: string,
  classes: string[],
  castingTime: string,
  range: string,
  components: string,
  duration: string,
  description: string,
  metadata: Record<string, unknown> = { source: 'PHB 2024', referenceOnly: true },
): SpellDefinition => ({
  id,
  ruleset: '2024',
  name,
  level,
  school,
  classes,
  castingTime,
  range,
  components,
  duration,
  description,
  metadata,
})

/** A small tagged sample catalog. It is intentionally not a complete PHB index. */
export const RULES_2024_SPELLS: SpellDefinition[] = [
  spell('fire-bolt', 'Огненный снаряд', 0, 'Воплощение', ['sorcerer', 'wizard'], 'Действие', '120 футов', 'В, С', 'Мгновенная', 'Огненный луч наносит урон цели при попадании.'),
  spell('light', 'Свет', 0, 'Воплощение', ['bard', 'cleric', 'sorcerer', 'wizard'], 'Действие', 'Касание', 'В, М', '1 час', 'Предмет начинает излучать яркий свет.'),
  spell('mage-hand', 'Волшебная рука', 0, 'Вызов', ['bard', 'sorcerer', 'warlock', 'wizard'], 'Действие', '30 футов', 'В, С', '1 минута', 'Призрачная рука выполняет простые манипуляции.'),
  spell('sacred-flame', 'Священное пламя', 0, 'Воплощение', ['cleric'], 'Действие', '60 футов', 'В, С', 'Мгновенная', 'Божественное пламя поражает цель светом.'),
  spell('druidcraft', 'Искусство друидов', 0, 'Преобразование', ['druid'], 'Действие', '30 футов', 'В, С', 'Мгновенная', 'Небольшой природный эффект по выбору заклинателя.'),
  spell('eldritch-blast', 'Мистический заряд', 0, 'Воплощение', ['warlock'], 'Действие', '120 футов', 'В, С', 'Мгновенная', 'Поток мистической энергии поражает цель.'),
  spell('bless', 'Благословение', 1, 'Очарование', ['cleric', 'paladin'], 'Действие', '30 футов', 'В, С, М', 'Концентрация, до 1 минуты', 'Благословляет союзников и помогает им в бросках.'),
  spell('cure-wounds', 'Лечение ран', 1, 'Воплощение', ['bard', 'cleric', 'druid', 'paladin', 'ranger'], 'Действие', 'Касание', 'В, С', 'Мгновенная', 'Восстанавливает хиты существа, которого касается заклинатель.'),
  spell('healing-word', 'Целительное слово', 1, 'Воплощение', ['bard', 'cleric', 'druid'], 'Бонусное действие', '60 футов', 'В', 'Мгновенная', 'Существо восстанавливает хиты на расстоянии.'),
  spell('hex', 'Порча', 1, 'Очарование', ['warlock'], 'Бонусное действие', '90 футов', 'В, С, М', 'Концентрация, до 1 часа', 'Проклинает цель и усиливает урон по ней.'),
  spell('hunter-mark', 'Метка охотника', 1, 'Прорицание', ['ranger'], 'Бонусное действие', '90 футов', 'В', 'Концентрация, до 1 часа', 'Помечает добычу и помогает отслеживать её.'),
  spell('magic-missile', 'Волшебная стрела', 1, 'Воплощение', ['sorcerer', 'wizard'], 'Действие', '120 футов', 'В, С', 'Мгновенная', 'Создаёт несколько автоматически попадающих энергетических стрел.'),
  spell('shield', 'Щит', 1, 'Ограждение', ['sorcerer', 'wizard'], 'Реакция', 'На себя', 'В, С', '1 раунд', 'Магический щит временно защищает заклинателя.'),
  spell('thunderwave', 'Громовая волна', 1, 'Воплощение', ['bard', 'druid', 'sorcerer', 'wizard'], 'Действие', 'На себя', 'В, С', 'Мгновенная', 'Волна грома поражает существ рядом с заклинателем.'),
  spell('misty-step', 'Туманный шаг', 2, 'Вызов', ['bard', 'sorcerer', 'warlock', 'wizard'], 'Бонусное действие', 'На себя', 'В', 'Мгновенная', 'Телепортирует заклинателя в видимое свободное место.'),
  spell('scorching-ray', 'Опаляющий луч', 2, 'Воплощение', ['sorcerer', 'wizard'], 'Действие', '120 футов', 'В, С', 'Мгновенная', 'Создаёт несколько огненных лучей.'),
  spell('counterspell', 'Контрзаклинание', 3, 'Ограждение', ['sorcerer', 'warlock', 'wizard'], 'Реакция', '60 футов', 'С', 'Мгновенная', 'Прерывает заклинание другого существа.'),
  spell('fireball', 'Огненный шар', 3, 'Воплощение', ['sorcerer', 'wizard'], 'Действие', '150 футов', 'В, С, М', 'Мгновенная', 'Взрыв пламени поражает область вокруг точки.'),
]

export function getRules2024Spell(id: string): SpellDefinition | undefined {
  return RULES_2024_SPELLS.find((item) => item.id === id)
}

export function isRules2024SpellId(id: string): boolean {
  return getRules2024Spell(id) !== undefined
}

export function getRules2024SpellsForClass(classId: string): SpellDefinition[] {
  return RULES_2024_SPELLS.filter((item) => item.classes.includes(classId))
}

export function getRules2024CantripsForClass(classId: string): SpellDefinition[] {
  return getRules2024SpellsForClass(classId).filter((item) => item.level === 0)
}
