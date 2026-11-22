import {
    RULES_2024_SPECIES as species,
    RULES_2024_CLASSES as classes,
    RULES_2024_BACKGROUNDS as backgrounds,
} from '@/data/rules2024'
import type {
    Rules2024Species,
    Rules2024Class,
    Rules2024Background,
} from '@/data/rules2024'
import { speciesIconFor } from './speciesIcons'
import { classIconFor, classIconVariantsFor } from './classIcons'
import { backgroundIconFor } from './backgroundIcons'

export {
    findRules2024Feat,
    getRules2024Feat,
    getRules2024ClassFeatures,
} from '@/data/rules2024'
export type { Rules2024Species, Rules2024Class, Rules2024Background } from '@/data/rules2024'

// Builder portraits belong to this module; the shared rules catalog stays presentation-free.
export const RULES_2024_SPECIES: Rules2024Species[] = species.map(value => ({
    ...value,
    icon: value.icon ?? speciesIconFor(value.id),
}))

export const RULES_2024_CLASSES: Rules2024Class[] = classes.map(value => ({
    ...value,
    icon: value.icon ?? classIconFor(value.id),
    iconByGender: value.iconByGender ?? classIconVariantsFor(value.id),
}))

export const RULES_2024_BACKGROUNDS: Rules2024Background[] = backgrounds.map(value => ({
    ...value,
    icon: value.icon ?? backgroundIconFor(value.id),
}))

export function getSpecies2024(id: string): Rules2024Species | undefined {
    return RULES_2024_SPECIES.find(item => item.id === id)
}

export function findSpecies2024(id: string): Rules2024Species {
    return getSpecies2024(id) ?? RULES_2024_SPECIES[0]!
}

export function getRules2024Class(id: string): Rules2024Class | undefined {
    return RULES_2024_CLASSES.find(item => item.id === id)
}

export function findRules2024Class(id: string): Rules2024Class {
    return getRules2024Class(id) ?? RULES_2024_CLASSES[0]!
}

export function getRules2024Background(id: string): Rules2024Background | undefined {
    return RULES_2024_BACKGROUNDS.find(item => item.id === id)
}

export function findRules2024Background(id: string): Rules2024Background {
    return getRules2024Background(id) ?? RULES_2024_BACKGROUNDS[0]!
}
