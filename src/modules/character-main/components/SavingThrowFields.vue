<script setup lang="ts">
import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSavingThrowBonus } from '@/domain/savingThrow'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '@/types/character'
import type { CharacterSavingThrows } from '@/types/character'
import type { CharacterSavingThrowPatch } from '@/types/characterView'

type Emits = {
    update: [key: AbilityKey, patch: CharacterSavingThrowPatch]
}

type Props = {
    abilities: CharacterAbilities
    savingThrows: CharacterSavingThrows
    level: number
    disabled?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function updateProficiency(key: AbilityKey, checked: boolean) {
    emit('update', key, { proficient: checked })
}

function result(key: AbilityKey) {
    const entry = props.savingThrows[key]
    return calculateSavingThrowBonus(
        { ability: key, proficient: entry.proficient },
        props.abilities,
        props.level,
    )
}
</script>

<template>
    <section class="c-sheet-section saving-throws-panel">
        <div class="c-section-heading c-section-heading-stack">
            <div>
                <h2>Спасброски</h2>
            </div>
        </div>
        <div class="saving-throws-grid">
            <div class="saving-throws-header" aria-hidden="true">
                <span></span>
                <span></span>
                <span>Итог</span>
            </div>
            <div v-for="field in ABILITY_FIELDS" :key="field.key" class="saving-throw-row">
                <div>
                    <strong>{{ field.label }}</strong>
                    <span class="c-field-caption">Модификатор + владение</span>
                </div>
                <label class="c-check-control">
                    <NCheckbox :checked="savingThrows[field.key].proficient" :disabled="disabled"
                        :aria-label="`${field.label}: владение`" @update:checked="updateProficiency(field.key, $event)">
                        Владение</NCheckbox>
                </label>
                <div class="saving-result">
                    <span class="saving-result-label">Итог</span><strong class="c-derived-value">{{
                        result(field.key) === null ? '—' : signedModifier(result(field.key)!)
                    }}</strong>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.saving-throws-grid {
    display: grid;
    gap: 10px;
    margin-top: 9px;
}

.saving-throws-header {
    display: grid;
    gap: 10px;
    align-items: end;
    padding: 0 4px;
    color: var(--sheet-faded);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-align: right;
    text-transform: uppercase;
}

.saving-throws-header span:last-child {
    white-space: nowrap;
}

.saving-throw-row {
    display: grid;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--sheet-line-soft);
}

.saving-throw-row:first-child {
    border-top: 0;
}

.saving-throws-panel .c-section-note {
    max-width: 34rem;
}

.saving-throw-row {
    padding-right: 4px;
}

.saving-result {
    align-self: end;
}

.saving-result {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    min-width: 0;
    min-height: 42px;
    padding: 0 7px 0 4px;
}

.saving-result-label {
    color: var(--sheet-faded);
    font-size: 0.66rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.saving-result .c-derived-value {
    min-width: 35px;
    color: var(--sheet-ink);
    font-size: 1rem;
}

.saving-result {
    min-width: 78px;
    padding: 6px 10px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 8px;
    background: rgba(255, 248, 231, 0.72);
}

.saving-result .c-derived-value {
    text-align: center;
}

.saving-throws-panel .saving-throw-row {
    border-color: #dfcba7;
}

.saving-result {
    border-color: #c9ac79;
    background: #fff4d9;
    box-shadow: inset 0 1px rgba(255, 255, 255, 0.65);
}

.saving-throw-row>*,
.saving-result {
    min-width: 0;
}

.saving-result {
    box-sizing: border-box;
    min-width: 96px;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
}

.saving-throws-header,
.saving-throw-row {
    grid-template-columns: minmax(0, 1fr) minmax(82px, auto) minmax(72px, 96px);
}

.saving-throws-header span:last-child {
    justify-self: center;
    text-align: center;
}
</style>
