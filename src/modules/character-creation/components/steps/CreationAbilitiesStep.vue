<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey } from '@/types/character'

import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<Pick<CharacterCreationModel, 'ruleset' | 'baseAbilities' | 'finalAbility'>>
    disabled?: boolean
}
type Emits = {
    updateAbility: [key: AbilityKey, score: number | null]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { ruleset, baseAbilities, finalAbility } = toRefs(props.model)
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
            <article
                v-for="field in ABILITY_FIELDS"
                :key="field.key"
                class="creation-ability-card"
                :class="{
                    'has-racial-bonus': finalAbility(field.key) !== baseAbilities[field.key],
                    'creation-ability-card-modern': ruleset === '2024',
                }"
            >
                <div class="creation-ability-input-row">
                    <NFormItem :label="field.label"
                        ><NInputNumber
                            min="1"
                            max="30"
                            step="1"
                            :show-button="false"
                            :disabled="disabled"
                            :value="baseAbilities[field.key]"
                            @update:value="emit('updateAbility', field.key, $event)" /></NFormItem
                    ><strong v-if="ruleset === '2024'" class="ability-modifier-inline">{{
                        signedModifier(abilityModifier(finalAbility(field.key)))
                    }}</strong>
                </div>
                <div v-if="ruleset !== '2024'" class="ability-result">
                    <span
                        >Итог <b>{{ finalAbility(field.key) }}</b></span
                    ><strong>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</strong>
                </div>
                <span
                    v-if="
                        ruleset !== '2024' && finalAbility(field.key) !== baseAbilities[field.key]
                    "
                    class="ability-source"
                    >Раса / подраса
                    {{ signedModifier(finalAbility(field.key) - baseAbilities[field.key]) }}</span
                ><span v-else-if="ruleset !== '2024'" class="ability-source"
                    >Без бонуса происхождения</span
                >
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
.creation-ability-card.has-racial-bonus {
    border-color: #bc975d;
    box-shadow: inset 0 0 0 1px rgba(188, 151, 93, 0.2);
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
.ability-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #796448;
    font-size: 0.75rem;
}
.ability-result b {
    margin-left: 5px;
    color: #4c3723;
    font-size: 1rem;
}
.ability-result strong {
    display: grid;
    place-items: center;
    min-width: 38px;
    min-height: 34px;
    border: 1px solid #d6c39e;
    border-radius: 9px;
    background: #fff7e6;
    color: #714d28;
    font-size: 1rem;
}
.ability-source {
    color: #90754f;
    font-size: 0.68rem;
    line-height: 1.3;
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
