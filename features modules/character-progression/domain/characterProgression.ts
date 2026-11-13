import { getRules2024Class } from '@/data/rules2024'
import type {
    CharacterProgression,
    ChoiceDefinition,
    ProgressionHistoryEntry,
} from '@/types/rules'
import {
    CHARACTER_LEVEL_MIN,
    CHARACTER_LEVEL_MAX,
    defaultProgressionChoiceMetadata,
    normalizeProgression,
    isLevel,
    featureIdsForClass,
    unique,
    featureGains,
    cloneChoices,
    featureGainsFromExisting,
} from '@/domain/characterProgressionData'

/** Reapply creation choices without erasing an existing level history. */
export function progressionAfterCreation(
    previous: CharacterProgression | undefined,
    created: CharacterProgression,
): CharacterProgression {
    if (!previous) return created
    const previousClassId = previous.classLevels[0]?.classId

    const sameClass = previousClassId === created.classLevels[0]?.classId

    const creationChoiceKeys = new Set(['classSkills', 'classEquipment', 'backgroundEquipment'])

    const preservedChoices = Object.fromEntries(
        Object.entries(previous.choices).filter(
            ([key]) =>
                !creationChoiceKeys.has(key) &&
                !(previousClassId && !sameClass && key.startsWith(`${previousClassId}.`)),
        ),
    )
    return normalizeProgression({
        ...created,
        features: sameClass
            ? unique([...previous.features, ...created.features])
            : created.features,
        choices: { ...preservedChoices, ...created.choices },
        gainedFeatures: sameClass ? previous.gainedFeatures : created.gainedFeatures,
        history: previous.history ?? [],
        choiceMetadata: previous.choiceMetadata ?? created.choiceMetadata,
    })
}

/** Return future selection metadata available at a level; no selection is applied. */
export function availableChoicesForProgression(
    progression: CharacterProgression,
    level = progression.level,
): ChoiceDefinition[] {
    const classEntry = progression.classLevels[0]
    if (
        !classEntry ||
        progression.level >= CHARACTER_LEVEL_MAX ||
        !isLevel(level) ||
        level < progression.level
    )
        return []
    const metadata = progression.choiceMetadata ?? defaultProgressionChoiceMetadata()
    if (
        !metadata.abilityScoreImprovementLevels.includes(level) &&
        !metadata.featChoiceLevels.includes(level)
    )
        return []
    const classDefinition = getRules2024Class(classEntry.classId)
    if (!classDefinition) return []
    return [
        {
            id: `${classEntry.classId}.level-${level}.asi-or-feat`,
            name: 'Улучшение характеристики или черта',
            options: ['ability-score-improvement', 'feat'],
            source: { kind: 'class', id: classEntry.classId, label: classDefinition.name },
        },
    ]
}

/**
 * Advance exactly one level and record references/metadata only. Rules effects,
 * ASI allocation and feat selection remain explicit future operations.
 */
export function levelUpProgression(
    progression: CharacterProgression,
    targetLevel = progression.level + 1,
): CharacterProgression {
    if (
        !isLevel(progression.level) ||
        !isLevel(targetLevel) ||
        targetLevel !== progression.level + 1
    ) {
        throw new Error('Повышение возможно только на один уровень за операцию.')
    }
    if (progression.classLevels.length === 0) {
        throw new Error('Для повышения уровня D&D 2024 нужен выбранный класс.')
    }
    const classLevels = progression.classLevels.map((entry, index) =>
        index === 0 ? { ...entry, level: targetLevel } : { ...entry },
    )

    const classId = classLevels[0]?.classId
    if (!classId || !getRules2024Class(classId)) {
        throw new Error('Для повышения уровня D&D 2024 нужен корректный класс.')
    }
    const existingFeatures = unique(progression.features ?? [])

    const availableFeatureIds = featureIdsForClass(classId, targetLevel)

    const existingSet = new Set(existingFeatures)

    const gainedIds = availableFeatureIds.filter(featureId => !existingSet.has(featureId))

    const gained = featureGains(gainedIds, classId, targetLevel)

    const existingGains = featureGainsFromExisting(progression, classId)

    const gainsById = new Map(existingGains.map(gain => [gain.featureId, gain]))
    for (const gain of gained) gainsById.set(gain.featureId, gain)
    const historyEntry: ProgressionHistoryEntry = {
        fromLevel: progression.level,
        toLevel: targetLevel,
        gainedFeatures: gained.map(gain => ({ ...gain, source: { ...gain.source } })),
        choices: {},
    }
    return {
        ...progression,
        level: targetLevel,
        classLevels,
        features: unique([...existingFeatures, ...gainedIds]),
        gainedFeatures: [...gainsById.values()].map(gain => ({
            ...gain,
            source: { ...gain.source },
        })),
        history: [...(progression.history ?? []), historyEntry],
        choices: cloneChoices(progression.choices),
        choiceMetadata: progression.choiceMetadata ?? defaultProgressionChoiceMetadata(),
    }
}

export interface ProgressionSelection {
    classId: string
    level: number
    featureIds?: string[]
    choices?: Record<string, string[]>
}

/** Create a deterministic single-class envelope for the current creation foundation. */
export function progressionForClass(selection: ProgressionSelection): CharacterProgression {
    const level = isLevel(selection.level) ? selection.level : CHARACTER_LEVEL_MIN

    const features = unique(
        selection.featureIds ?? featureIdsForClass(selection.classId, level),
    )
    return {
        level,
        classLevels: [{ classId: selection.classId, level }],
        features,
        choices: Object.fromEntries(
            Object.entries(selection.choices ?? {}).map(([key, values]) => [key, [...values]]),
        ),
        gainedFeatures: featureGains(features, selection.classId, level),
        history: [],
        choiceMetadata: defaultProgressionChoiceMetadata(),
    }
}

