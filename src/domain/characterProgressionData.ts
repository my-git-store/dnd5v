import { getRules2024Class } from '../data/rules2024/index.ts'
import type { Character } from '../types/character.ts'
import type {
    CharacterProgression,
    ClassLevelEntry,
    ProgressionChoiceMetadata,
    ProgressionFeatureGain,
    RuleSourceRef,
} from '../types/rules.ts'

export const CHARACTER_LEVEL_MIN = 1
export const CHARACTER_LEVEL_MAX = 20

/** D&D 2024 milestone metadata only; no ASI or feat is applied automatically. */
export const RULES_2024_ASI_LEVELS = [4, 8, 12, 16, 19] as const
export const RULES_2024_FEAT_CHOICE_LEVELS = [4, 8, 12, 16, 19] as const

export function defaultProgressionChoiceMetadata(): ProgressionChoiceMetadata {
    return {
        abilityScoreImprovementLevels: [...RULES_2024_ASI_LEVELS],
        featChoiceLevels: [...RULES_2024_FEAT_CHOICE_LEVELS],
    }
}

export function isLevel(value: unknown): value is number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= CHARACTER_LEVEL_MIN &&
        value <= CHARACTER_LEVEL_MAX
    )
}

function creationData(value: Character): Record<string, unknown> | undefined {
    const extensions = value.extensions as Record<string, unknown> | undefined

    const creation = extensions?.characterCreation
    return creation && typeof creation === 'object'
        ? (creation as Record<string, unknown>)
        : undefined
}

function classIdFromCharacter(value: Character): string | undefined {
    const classId = creationData(value)?.classId
    return typeof classId === 'string' && classId.length > 0 ? classId : undefined
}

function selectedChoices(value: Character): Record<string, string[]> {
    const creation = creationData(value)
    if (!creation) return {}
    const choices: Record<string, string[]> = {}
    if (Array.isArray(creation.classSkillIds))
        choices.classSkills = creation.classSkillIds.filter(
            (item): item is string => typeof item === 'string',
        )
    if (typeof creation.classEquipmentId === 'string' && creation.classEquipmentId)
        choices.classEquipment = [creation.classEquipmentId]
    if (typeof creation.backgroundEquipmentId === 'string' && creation.backgroundEquipmentId)
        choices.backgroundEquipment = [creation.backgroundEquipmentId]
    return choices
}

export function featureIdsForClass(
    classId: string | undefined,
    level: number,
): string[] {
    if (!classId) return []
    return (
        getRules2024Class(classId)
            ?.levelFeaturesMetadata.filter(feature => feature.level <= level)
            .map(feature => feature.id) ?? []
    )
}

export function unique(values: string[]): string[] {
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

export function featureGains(
    featureIds: string[],
    classId: string | undefined,
    fallbackLevel = 1,
): ProgressionFeatureGain[] {
    const classFeatures = classId ? (getRules2024Class(classId)?.levelFeaturesMetadata ?? []) : []
    return unique(featureIds).map(featureId => {
        const definition = classFeatures.find(feature => feature.id === featureId)
        return {
            featureId,
            level: definition?.level ?? fallbackLevel,
            source: sourceForFeature(featureId, classId),
        }
    })
}

export function cloneChoices(value: Record<string, string[]> | undefined): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries(value ?? {}).map(([key, options]) => [key, [...options]]),
    )
}

export function featureGainsFromExisting(
    value: CharacterProgression,
    classId: string | undefined,
): ProgressionFeatureGain[] {
    const featureIds = new Set(value.features ?? value.featureIds ?? [])
    if (Array.isArray(value.gainedFeatures)) {
        const seen = new Set<string>()

        const existing = value.gainedFeatures
            .filter(gain => {
                if (
                    !gain ||
                    typeof gain.featureId !== 'string' ||
                    !featureIds.has(gain.featureId) ||
                    seen.has(gain.featureId)
                )
                    return false
                seen.add(gain.featureId)
                return true
            })
            .map(gain => ({
                featureId: gain.featureId,
                level: gain.level,
                source: { ...gain.source },
            }))

        const missing = [...featureIds].filter(featureId => !seen.has(featureId))
        return [...existing, ...featureGains(missing, classId, value.level)]
    }
    return featureGains(value.features ?? value.featureIds ?? [], classId, value.level)
}

/** Add safe runtime defaults to progression metadata without applying any effects. */
export function normalizeProgression(value: CharacterProgression): CharacterProgression {
    const classId = value.classLevels[0]?.classId
    return {
        ...value,
        features: unique(value.features ?? value.featureIds ?? []),
        choices: cloneChoices(value.choices),
        gainedFeatures: featureGainsFromExisting(value, classId),
        history: Array.isArray(value.history)
            ? value.history.map(entry => ({
                  ...entry,
                  gainedFeatures: Array.isArray(entry.gainedFeatures)
                      ? entry.gainedFeatures.map(gain => ({ ...gain, source: { ...gain.source } }))
                      : [],
                  choices: cloneChoices(entry.choices),
              }))
            : [],
        ...(value.choiceMetadata === undefined
            ? { choiceMetadata: defaultProgressionChoiceMetadata() }
            : {}),
    }
}

/** Build a progression envelope from the current character without applying any rules. */
export function defaultProgressionForCharacter(value: Character): CharacterProgression {
    const level = isLevel(value.identity.level) ? value.identity.level : CHARACTER_LEVEL_MIN

    const classId = classIdFromCharacter(value)

    const classLevelValue = creationData(value)?.classLevel

    const classLevel = isLevel(classLevelValue) ? classLevelValue : level

    const classLevels: ClassLevelEntry[] = classId ? [{ classId, level: classLevel }] : []
    return {
        level,
        classLevels,
        features: featureIdsForClass(classId, classLevel),
        choices: selectedChoices(value),
        gainedFeatures: featureGains(
            featureIdsForClass(classId, classLevel),
            classId,
            classLevel,
        ),
        history: [],
        choiceMetadata: defaultProgressionChoiceMetadata(),
    }
}

/** Keep the progression summary synchronized when the existing sheet level is edited. */
export function progressionAtLevel(
    progression: CharacterProgression,
    level: number,
): CharacterProgression {
    const nextLevel = isLevel(level) ? level : progression.level

    const classLevels = progression.classLevels.map((entry, index) =>
        index === 0 ? { ...entry, level: nextLevel } : { ...entry },
    )
    return { ...progression, level: nextLevel, classLevels }
}
