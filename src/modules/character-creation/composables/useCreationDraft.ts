import { reactive, ref } from 'vue'

import { RULES_2024_SPECIES, RULES_2024_CLASSES, RULES_2024_BACKGROUNDS } from '@/data/rules2024'
import type {
    AbilityKey,
    CharacterAbilities,
    CharacterGender,
    CharacterRuleset,
} from '@/types/character'

import type { CreationDraft } from '../types/characterCreation'

export function useCreationDraft(): CreationDraft {
    // Always start a new draft; saved sheet choices must never prefill creation.
    const currentStep = ref(1)

    const ruleset = ref<CharacterRuleset>('2024')

    const highestUnlockedStep = ref(1)

    const isCompleted = ref(false)

    const raceId = ref(RULES_2024_SPECIES[0]!.id)

    const subraceId = ref('')

    const classId = ref(RULES_2024_CLASSES[0]!.id)

    const backgroundId = ref(RULES_2024_BACKGROUNDS[0]?.id ?? '')

    const backgroundEquipmentId = ref(RULES_2024_BACKGROUNDS[0]?.equipmentOptions[0]?.id ?? '')

    const backgroundAbilityChoices = ref<AbilityKey[]>([
        ...(RULES_2024_BACKGROUNDS[0]?.abilityOptions ?? []).slice(0, 3),
    ])

    const originAbilityFocus = ref<AbilityKey | undefined>(
        RULES_2024_BACKGROUNDS[0]?.abilityOptions[0],
    )

    const speciesChoices = ref<Record<string, string[]>>({})

    const name = ref('')

    const gender = ref<CharacterGender>('female')

    const subclass = ref('')

    const alignment = ref('')

    const selectedSkillIds = ref<string[]>([])

    const raceSkillChoices = ref<string[]>([])

    const raceAbilityChoices = ref<AbilityKey[]>([])

    const baseAbilities = reactive<CharacterAbilities>({
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
    })

    const classEquipmentId = ref(RULES_2024_CLASSES[0]?.equipmentOptions?.[0]?.id ?? '')
    return {
        currentStep,
        ruleset,
        highestUnlockedStep,
        isCompleted,
        raceId,
        subraceId,
        classId,
        backgroundId,
        backgroundEquipmentId,
        backgroundAbilityChoices,
        originAbilityFocus,
        speciesChoices,
        name,
        gender,
        subclass,
        alignment,
        selectedSkillIds,
        raceSkillChoices,
        raceAbilityChoices,
        baseAbilities,
        classEquipmentId,
    }
}
