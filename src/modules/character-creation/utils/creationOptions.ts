import { findBackground } from '@/data/dnd5eOptions'
import type { Dnd5eClassOption, Dnd5eRaceOption } from '@/data/dnd5eOptions'
import {
    findSpecies2024,
    findRules2024Class,
    findRules2024Background,
    findRules2024Feat,
} from '@/data/rules2024'
import { backgroundIconFor } from '@/data/backgroundIcons'
import type { CharacterRuleset } from '@/types/character'

import type { CreationBackgroundOption } from '../types/characterCreation'

export function speciesAsLegacy(id: string): Dnd5eRaceOption {
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

export function classAsLegacy(id: string): Dnd5eClassOption {
    const option = findRules2024Class(id)
    return {
        id: option.id,
        label: option.label,
        description: option.description,
        hitDie: option.hitDie,
        primaryAbility: option.primaryAbility,
        primaryAbilities: [...option.primaryAbilities],
        icon: option.icon,
        iconByGender: option.iconByGender,
        spellcastingAbility: option.spellcastingAbility,
        spellProgressionType: option.spellProgressionType,
        savingThrowKeys: [...option.savingThrowKeys],
        savingThrowProficiencies: [...option.savingThrowProficiencies],
        skillChoiceCount: option.skillChoiceCount,
        skillOptions: [...option.skillOptions],
        skillChoices: {
            count: option.skillChoices.count,
            options: [...option.skillChoices.options],
        },
        features: [...option.features],
        proficiencies: [...option.proficiencies],
        weaponProficiencies: [...option.weaponProficiencies],
        armorProficiencies: [...option.armorProficiencies],
        equipmentOptions: option.equipmentOptions,
        startingEquipment: option.startingEquipment,
    }
}

export function backgroundAsCreation(
    id: string,
    ruleset: CharacterRuleset,
): CreationBackgroundOption {
    if (ruleset === '2024') {
        const background = findRules2024Background(id)

        const feat = findRules2024Feat(background.originFeatId)
        return {
            id: background.id,
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
    return findBackground(id)
}
