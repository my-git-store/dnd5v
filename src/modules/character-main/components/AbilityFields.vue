<script setup lang="ts">
import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '@/types/character'

type Emits = {
    update: [key: AbilityKey, value: number]
}

defineProps<{ abilities: CharacterAbilities; disabled?: boolean }>()

const emit = defineEmits<Emits>()

function onInput(key: AbilityKey, value: unknown) {
    const numberValue = Number(value)
    emit('update', key, Number.isFinite(numberValue) ? numberValue : 0)
}
</script>
<template>
    <section class="c-sheet-section ability-panel">
        <div class="c-section-heading c-section-heading-stack">
            <div>
                <h2>Характеристики</h2>
                <p class="c-section-note">
                    Введите исходные значения. Модификатор справа рассчитывается автоматически.
                </p>
            </div>
        </div>
        <div class="ability-grid">
            <div v-for="field in ABILITY_FIELDS" :key="field.key" class="c-field-card">
                <NFormItem :label="field.label">
                    <NInputNumber
                        :show-button="false"
                        :disabled="disabled"
                        :value="abilities[field.key]"
                        @update:value="onInput(field.key, $event)"
                    />
                </NFormItem>
                <p class="modifier-caption" :title="'Модификатор = ⌊(значение − 10) / 2⌋'">
                    Модификатор (расчёт):
                    {{ signedModifier(abilityModifier(abilities[field.key])) }}
                </p>
            </div>
        </div>
    </section>
</template>

<style scoped>
.c-character-sheet .ability-grid .c-field-card {
    row-gap: 12px;
}
.ability-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
.modifier-caption {
    margin: 6px 0 0;
    color: var(--sheet-muted);
    font-size: 0.78rem;
}
.ability-grid .c-field-card {
    display: grid;
    align-content: start;
    gap: 8px;
    padding: 10px;
}
.ability-grid :deep(.flex-col > label) {
    font-size: 0.72rem !important;
    line-height: 1.2;
    text-align: center;
}
.ability-grid :deep(.n-input) {
    padding-inline: 6px;
    border-radius: 10px;
    font-size: 1.15rem;
    font-weight: 800;
    text-align: center;
}
.ability-grid .modifier-caption {
    margin-top: 2px;
    font-size: 0.74rem;
    text-align: center;
}
.ability-panel .c-section-note {
    max-width: 34rem;
}
.ability-panel .c-field-card {
    border-color: #dfcba7;
    background: linear-gradient(145deg, rgba(255, 249, 234, 0.9), rgba(247, 232, 201, 0.62));
}
.ability-panel .modifier-caption {
    color: #805b36;
    font-weight: 700;
}
.ability-grid .c-field-card,
.ability-grid :deep(.flex-col),
.ability-grid :deep(.n-input-wrapper) {
    min-width: 0;
}
.ability-grid :deep(.flex-col > label) {
    display: block;
    max-width: 100%;
    overflow-wrap: normal;
    word-break: normal;
    hyphens: none;
}
</style>
