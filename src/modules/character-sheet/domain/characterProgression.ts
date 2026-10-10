import { getRules2024Class } from '../data/rules2024/index.ts'
import type { CharacterRuleset, CharacterV3 } from '../types/characterV3.ts'
import type { CharacterProgressionV3, ChoiceDefinition, ClassLevelEntry, ProgressionChoiceMetadata, ProgressionFeatureGain, ProgressionHistoryEntry, RuleSourceRef } from '../types/rules.ts'

export const CHARACTER_LEVEL_MIN = 1
export const CHARACTER_LEVEL_MAX = 20

/** D&D 2024 milestone metadata only; no ASI or feat is applied automatically. */
export const RULES_2024_ASI_LEVELS = [4, 8, 12, 16, 19] as const
export const RULES_2024_FEAT_CHOICE_LEVELS = [4, 8, 12, 16, 19] as const

export function defaultProgressionChoiceMetadata(ruleset: CharacterRuleset): ProgressionChoiceMetadata {
  return ruleset === '2024'
    ? { abilityScoreImprovementLevels: [...RULES_2024_ASI_LEVELS], featChoiceLevels: [...RULES_2024_FEAT_CHOICE_LEVELS] }
    : { abilityScoreImprovementLevels: [], featChoiceLevels: [] }
}

function isLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= CHARACTER_LEVEL_MIN && value <= CHARACTER_LEVEL_MAX
}

function creationData(value: CharacterV3): Record<string, unknown> | undefined {
  const extensions = value.extensions as Record<string, unknown> | undefined
  const creation = extensions?.characterCreation
  return creation && typeof creation === 'object' ? creation as Record<string, unknown> : undefined
}

function classIdFromCharacter(value: CharacterV3): string | undefined {
  const classId = creationData(value)?.classId
  return typeof classId === 'string' && classId.length > 0 ? classId : undefined
}

function selectedChoices(value: CharacterV3): Record<string, string[]> {
  const creation = creationData(value)
  if (!creation) return {}
  const choices: Record<string, string[]> = {}
  if (Array.isArray(creation.classSkillIds)) choices.classSkills = creation.classSkillIds.filter((item): item is string => typeof item === 'string')
  if (typeof creation.classEquipmentId === 'string' && creation.classEquipmentId) choices.classEquipment = [creation.classEquipmentId]
  if (typeof creation.backgroundEquipmentId === 'string' && creation.backgroundEquipmentId) choices.backgroundEquipment = [creation.backgroundEquipmentId]
  return choices
}

function featureIdsForClass(ruleset: CharacterRuleset, classId: string | undefined, level: number): string[] {
  if (ruleset !== '2024' || !classId) return []
  return getRules2024Class(classId)?.levelFeaturesMetadata
    .filter((feature) => feature.level <= level)
    .map((feature) => feature.id) ?? []
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function sourceForFeature(_featureId: string, classId: string | undefined): RuleSourceRef {
  const classDefinition = getRules2024Class(classId ?? '')
  return {
    kind: 'class',
    id: classId || 'legacy',
    ...(classDefinition?.name ? { label: classDefinition.name } : {}),
  }
}

function featureGains(featureIds: string[], classId: string | undefined, fallbackLevel = 1): ProgressionFeatureGain[] {
  const classFeatures = classId ? getRules2024Class(classId)?.levelFeaturesMetadata ?? [] : []
  return unique(featureIds).map((featureId) => {
    const definition = classFeatures.find((feature) => feature.id === featureId)
    return { featureId, level: definition?.level ?? fallbackLevel, source: sourceForFeature(featureId, classId) }
  })
}

function cloneChoices(value: Record<string, string[]> | undefined): Record<string, string[]> {
  return Object.fromEntries(Object.entries(value ?? {}).map(([key, options]) => [key, [...options]]))
}

function featureGainsFromExisting(value: CharacterProgressionV3, classId: string | undefined): ProgressionFeatureGain[] {
  const featureIds = new Set(value.features ?? value.featureIds ?? [])
  if (Array.isArray(value.gainedFeatures)) {
    const seen = new Set<string>()
    const existing = value.gainedFeatures.filter((gain) => {
      if (!gain || typeof gain.featureId !== 'string' || !featureIds.has(gain.featureId) || seen.has(gain.featureId)) return false
      seen.add(gain.featureId)
      return true
    }).map((gain) => ({ featureId: gain.featureId, level: gain.level, source: { ...gain.source } }))
    const missing = [...featureIds].filter((featureId) => !seen.has(featureId))
    return [...existing, ...featureGains(missing, classId, value.level)]
  }
  return featureGains(value.features ?? value.featureIds ?? [], classId, value.level)
}

/** Add safe runtime defaults to progression metadata without applying any effects. */
export function normalizeProgression(value: CharacterProgressionV3, _ruleset: CharacterRuleset): CharacterProgressionV3 {
  const classId = value.classLevels[0]?.classId
  return {
    ...value,
    features: unique(value.features ?? value.featureIds ?? []),
    choices: cloneChoices(value.choices),
    gainedFeatures: featureGainsFromExisting(value, classId),
    history: Array.isArray(value.history) ? value.history.map((entry) => ({
      ...entry,
      gainedFeatures: Array.isArray(entry.gainedFeatures) ? entry.gainedFeatures.map((gain) => ({ ...gain, source: { ...gain.source } })) : [],
      choices: cloneChoices(entry.choices),
    })) : [],
    ...(value.choiceMetadata === undefined ? { choiceMetadata: defaultProgressionChoiceMetadata(_ruleset) } : {}),
  }
}

/** Reapply creation choices without erasing an existing level history. */
export function progressionAfterCreation(previous: CharacterProgressionV3 | undefined, created: CharacterProgressionV3, previousRuleset: CharacterRuleset, ruleset: CharacterRuleset): CharacterProgressionV3 {
  if (!previous || previousRuleset !== ruleset) return created
  const previousClassId = previous.classLevels[0]?.classId
  const sameClass = previousClassId === created.classLevels[0]?.classId
  const creationChoiceKeys = new Set(['classSkills', 'classEquipment', 'backgroundEquipment'])
  const preservedChoices = Object.fromEntries(Object.entries(previous.choices).filter(([key]) =>
    !creationChoiceKeys.has(key) && !(previousClassId && !sameClass && key.startsWith(`${previousClassId}.`))))
  return normalizeProgression({
    ...created,
    features: sameClass ? unique([...previous.features, ...created.features]) : created.features,
    choices: { ...preservedChoices, ...created.choices },
    gainedFeatures: sameClass ? previous.gainedFeatures : created.gainedFeatures,
    history: previous.history ?? [],
    choiceMetadata: previous.choiceMetadata ?? created.choiceMetadata,
  }, ruleset)
}

/** Return future selection metadata available at a level; no selection is applied. */
export function availableChoicesForProgression(progression: CharacterProgressionV3, level = progression.level, ruleset: CharacterRuleset = '2024'): ChoiceDefinition[] {
  const classEntry = progression.classLevels[0]
  if (!classEntry || progression.level >= CHARACTER_LEVEL_MAX || !isLevel(level) || level < progression.level) return []
  const metadata = progression.choiceMetadata ?? defaultProgressionChoiceMetadata(ruleset)
  if (!metadata.abilityScoreImprovementLevels.includes(level) && !metadata.featChoiceLevels.includes(level)) return []
  if (ruleset !== '2024') return []
  const classDefinition = getRules2024Class(classEntry.classId)
  if (!classDefinition) return []
  return [{
    id: `${classEntry.classId}.level-${level}.asi-or-feat`,
    name: 'Улучшение характеристики или черта',
    options: ['ability-score-improvement', 'feat'],
    source: { kind: 'class', id: classEntry.classId, label: classDefinition.name },
  }]
}

/**
 * Advance exactly one level and record references/metadata only. Rules effects,
 * ASI allocation and feat selection remain explicit future operations.
 */
export function levelUpProgression(progression: CharacterProgressionV3, targetLevel = progression.level + 1, ruleset: CharacterRuleset = '2024'): CharacterProgressionV3 {
  if (!isLevel(progression.level) || !isLevel(targetLevel) || targetLevel !== progression.level + 1) {
    throw new Error('Повышение возможно только на один уровень за операцию.')
  }
  if (ruleset === '2024' && progression.classLevels.length === 0) {
    throw new Error('Для повышения уровня D&D 2024 нужен выбранный класс.')
  }
  const classLevels = progression.classLevels.map((entry, index) => index === 0 ? { ...entry, level: targetLevel } : { ...entry })
  const classId = classLevels[0]?.classId
  if (ruleset === '2024' && (!classId || !getRules2024Class(classId))) {
    throw new Error('Для повышения уровня D&D 2024 нужен корректный класс.')
  }
  const existingFeatures = unique(progression.features ?? [])
  const availableFeatureIds = featureIdsForClass(ruleset, classId, targetLevel)
  const existingSet = new Set(existingFeatures)
  const gainedIds = availableFeatureIds.filter((featureId) => !existingSet.has(featureId))
  const gained = featureGains(gainedIds, classId, targetLevel)
  const existingGains = featureGainsFromExisting(progression, classId)
  const gainsById = new Map(existingGains.map((gain) => [gain.featureId, gain]))
  for (const gain of gained) gainsById.set(gain.featureId, gain)
  const historyEntry: ProgressionHistoryEntry = {
    fromLevel: progression.level,
    toLevel: targetLevel,
    gainedFeatures: gained.map((gain) => ({ ...gain, source: { ...gain.source } })),
    choices: {},
  }
  return {
    ...progression,
    level: targetLevel,
    classLevels,
    features: unique([...existingFeatures, ...gainedIds]),
    gainedFeatures: [...gainsById.values()].map((gain) => ({ ...gain, source: { ...gain.source } })),
    history: [...(progression.history ?? []), historyEntry],
    choices: cloneChoices(progression.choices),
    choiceMetadata: progression.choiceMetadata ?? defaultProgressionChoiceMetadata(ruleset),
  }
}

/** Build a progression envelope from the current character without applying any rules. */
export function defaultProgressionForCharacter(value: CharacterV3): CharacterProgressionV3 {
  const level = isLevel(value.identity.level) ? value.identity.level : CHARACTER_LEVEL_MIN
  const classId = classIdFromCharacter(value)
  const classLevelValue = creationData(value)?.classLevel
  const classLevel = isLevel(classLevelValue) ? classLevelValue : level
  const classLevels: ClassLevelEntry[] = classId ? [{ classId, level: classLevel }] : []
  return {
    level,
    classLevels,
    features: featureIdsForClass(value.ruleset, classId, classLevel),
    choices: selectedChoices(value),
    gainedFeatures: featureGains(featureIdsForClass(value.ruleset, classId, classLevel), classId, classLevel),
    history: [],
    choiceMetadata: defaultProgressionChoiceMetadata(value.ruleset),
  }
}

export interface ProgressionSelection {
  ruleset: CharacterRuleset
  classId: string
  level: number
  featureIds?: string[]
  choices?: Record<string, string[]>
}

/** Create a deterministic single-class envelope for the current creation foundation. */
export function progressionForClass(selection: ProgressionSelection): CharacterProgressionV3 {
  const level = isLevel(selection.level) ? selection.level : CHARACTER_LEVEL_MIN
  const features = unique(selection.featureIds ?? featureIdsForClass(selection.ruleset, selection.classId, level))
  return {
    level,
    classLevels: [{ classId: selection.classId, level }],
    features,
    choices: Object.fromEntries(Object.entries(selection.choices ?? {}).map(([key, values]) => [key, [...values]])),
    gainedFeatures: featureGains(features, selection.classId, level),
    history: [],
    choiceMetadata: defaultProgressionChoiceMetadata(selection.ruleset),
  }
}

/** Keep the progression summary synchronized when the existing sheet level is edited. */
export function progressionAtLevel(progression: CharacterProgressionV3, level: number): CharacterProgressionV3 {
  const nextLevel = isLevel(level) ? level : progression.level
  const classLevels = progression.classLevels.map((entry, index) => index === 0 ? { ...entry, level: nextLevel } : { ...entry })
  return { ...progression, level: nextLevel, classLevels }
}
