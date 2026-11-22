import { findSpecies2024, findRules2024Background, findRules2024Feat } from '../data/rules2024'
import { backgroundIconFor } from '../data/backgroundIcons'

import type { CreationBackgroundOption, CreationSpeciesOption } from '../types/characterCreation'

export function speciesAsCreation(id: string): CreationSpeciesOption {
    const species = findSpecies2024(id)
    return {
        id: species.id,
        label: species.name,
        profile: {
            name: species.name,
            subrace: '',
            size: species.size,
            speed: species.speed,
            abilityBonuses: {},
            traits: [...species.traits],
            languages: [...species.languages],
        },
    }
}

export function backgroundAsCreation(id: string): CreationBackgroundOption {
    const background = findRules2024Background(id)

    const feat = findRules2024Feat(background.originFeatId)
    return {
        ...background,
        label: background.label,
        description: background.description,
        icon: background.icon ?? backgroundIconFor(background.id),
        skillProficiencies: [...background.skillProficiencies],
        toolProficiencies: [...background.toolProficiencies],
        languages: [...background.languages],
        feature: background.feature,
        equipmentOptions: background.equipmentOptions,
        abilityOptions: [...background.abilityOptions],
        originFeatId: background.originFeatId,
        originFeatLabel: feat?.label,
        originFeatDescription: feat?.description,
    }
}
