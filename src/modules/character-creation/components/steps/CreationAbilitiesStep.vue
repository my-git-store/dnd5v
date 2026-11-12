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
    <div class="creation-step-content">
        <div class="creation-source-hint">
            <span class="source-dot race-dot"></span
            ><span
                >Выберите исходные значения характеристик. Навыки выбираются напрямую на следующем
                шаге.</span
            >
        </div>
        <div class="creator-abilities creation-ability-grid">
            <article v-for="field in ABILITY_FIELDS" :key="field.key" class="creation-ability-card">
                <div class="creation-ability-input-row">
                    <NFormItem :label="field.label"
                        ><NInputNumber
                            button-placement="both"
                            min="1"
                            max="30"
                            step="1"
                            :disabled="disabled"
                            :value="baseAbilities[field.key]"
                            @update:value="emit('updateAbility', field.key, $event)" /></NFormItem
                    ><strong class="ability-modifier-inline">{{
                        signedModifier(abilityModifier(finalAbility(field.key)))
                    }}</strong>
                </div>
            </article>
        </div>
    </div>
</template>

<style scoped>
.creator-abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-top: 16px;
}
.creation-ability-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 11px;
}
.creation-ability-card {
    display: grid;
    gap: 9px;
    min-width: 0;
    padding: 13px;
    border: 1px solid #dfd0b5;
    border-radius: 12px;
    background: rgba(255, 249, 236, 0.78);
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}
.creation-ability-input-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-width: 0;
}
.creation-ability-input-row > :deep(.flex-col) {
    flex: 1 1 auto;
    min-width: 0;
}
.ability-modifier-inline {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    min-width: 38px;
    min-height: 34px;
    border: 1px solid #d6c39e;
    border-radius: 9px;
    background: #fff7e6;
    color: #714d28;
    font-size: 1rem;
}
.creation-ability-card :deep(.n-input) {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 800;
}
.creation-source-hint {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-bottom: 13px;
    color: #78664f;
    font-size: 0.78rem;
    line-height: 1.4;
}
.source-dot {
    display: inline-block;
    flex: 0 0 9px;
    width: 9px;
    height: 9px;
    margin-top: 4px;
    border-radius: 50%;
}
.race-dot {
    background: #a67536;
}
</style>
