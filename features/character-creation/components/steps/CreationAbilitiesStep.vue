<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey } from '@/types/character'

import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<Pick<CharacterCreationModel, 'baseAbilities' | 'finalAbility'>>
    disabled?: boolean
}
type Emits = {
    updateAbility: [key: AbilityKey, score: number | null]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { baseAbilities, finalAbility } = toRefs(props.model)
</script>

<template>
    <div class="grid gap-4">
        <div>
            <span></span
            ><span
                >Выберите исходные значения характеристик. Навыки выбираются напрямую на следующем
                шаге.</span
            >
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article v-for="field in ABILITY_FIELDS" :key="field.key">
                <div>
                    <NFormItem :label="field.label"
                        ><NInputNumber
                            button-placement="both"
                            min="1"
                            max="30"
                            step="1"
                            :disabled="disabled"
                            :value="baseAbilities[field.key]"
                            @update:value="emit('updateAbility', field.key, $event)" /></NFormItem
                    ><strong>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</strong>
                </div>
            </article>
        </div>
    </div>
</template>
