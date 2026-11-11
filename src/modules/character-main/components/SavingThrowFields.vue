<script setup lang="ts">
import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSavingThrowBonus } from '@/domain/savingThrow'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '@/types/character'
import type { CharacterSavingThrows } from '@/types/character'

const props = defineProps<{
    abilities: CharacterAbilities
    savingThrows: CharacterSavingThrows
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<{
    update: [key: AbilityKey, patch: { proficient?: boolean; additionalBonus?: number }]
}>()

function updateBonus(key: AbilityKey, value: unknown) {
    const parsed = Number(value)
    emit('update', key, { additionalBonus: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
}

function updateProficiency(key: AbilityKey, checked: boolean) {
    emit('update', key, { proficient: checked })
}

function result(key: AbilityKey) {
    const entry = props.savingThrows[key]
    return calculateSavingThrowBonus(
        { ability: key, proficient: entry.proficient, additionalBonus: entry.additionalBonus },
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
                <p class="c-section-note">
                    Итог складывается из модификатора характеристики, владения и добавки.
                </p>
            </div>
        </div>
        <div class="saving-throws-grid">
            <div class="saving-throws-header" aria-hidden="true">
                <span></span>
                <span></span>
                <span>Добавка</span>
                <span>Итог</span>
            </div>
            <div v-for="field in ABILITY_FIELDS" :key="field.key" class="saving-throw-row">
                <div>
                    <strong>{{ field.label }}</strong
                    ><span class="c-field-caption">Модификатор + владение + добавка</span>
                </div>
                <label class="c-check-control"
                    ><NCheckbox
                        :checked="savingThrows[field.key].proficient"
                        :disabled="disabled"
                        :aria-label="`${field.label}: владение`"
                        @update:checked="updateProficiency(field.key, $event)"
                        >Владение</NCheckbox
                    ></label
                >
                <NInputNumber
                    step="1"
                    aria-label="Добавка"
                    :disabled="disabled"
                    :value="savingThrows[field.key].additionalBonus"
                    @update:value="updateBonus(field.key, $event)"
                />
                <div class="saving-result">
                    <span class="saving-result-label">Итог</span
                    ><strong class="c-derived-value">{{
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
    grid-template-columns: minmax(0, 1fr) minmax(82px, auto) minmax(84px, 96px) minmax(72px, 96px);
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
.saving-throws-header span:nth-child(3),
.saving-throws-header span:nth-child(4) {
    white-space: nowrap;
}
.saving-throw-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(82px, auto) minmax(84px, 96px) minmax(72px, 96px);
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-top: 1px solid var(--sheet-line-soft);
}
.saving-throw-row:first-child {
    border-top: 0;
}
@media (max-width: 560px) {
    .saving-throw-row {
        grid-template-columns: minmax(0, 1fr) auto;
    }
    .saving-throw-row :deep(.n-input-wrapper),
    .saving-throw-row .c-derived-value {
        grid-column: auto;
    }
}
.saving-throws-panel .c-section-note {
    max-width: 34rem;
}
.saving-throw-row {
    grid-template-columns: minmax(145px, 1.35fr) minmax(92px, auto) minmax(102px, 112px) minmax(
            62px,
            72px
        );
    padding-right: 4px;
}
.saving-throw-row > :deep(.flex-col),
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
@media (max-width: 1000px) {
    .saving-throw-row {
        grid-template-columns: minmax(130px, 1.2fr) minmax(90px, auto) minmax(96px, 110px) minmax(
                62px,
                72px
            );
    }
}
@media (max-width: 800px) {
    .saving-throw-row {
        grid-template-columns: minmax(130px, 1fr) auto minmax(92px, 104px) minmax(96px, 104px);
        gap: 8px;
    }
}
@media (max-width: 560px) {
    .saving-throw-row {
        grid-template-columns: minmax(0, 1fr) auto;
        padding-right: 0;
    }
    .saving-throw-row :deep(.n-input-wrapper) {
        grid-column: 1 / 2;
    }
    .saving-result {
        grid-column: 2;
        grid-row: 2;
        padding-right: 5px;
    }
    .saving-result-label {
        display: none;
    }
    .saving-result {
        min-width: 64px;
        padding-inline: 7px;
    }
}
.saving-throws-panel .saving-throw-row {
    border-color: #dfcba7;
}
.saving-result {
    border-color: #c9ac79;
    background: #fff4d9;
    box-shadow: inset 0 1px rgba(255, 255, 255, 0.65);
}
.saving-throw-row > *,
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
.saving-throw-row > :deep(.flex-col) {
    min-width: 0;
    max-width: 100%;
}
.saving-throw-row > :deep(.flex-col .n-input) {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
}
.saving-throws-header,
.saving-throw-row {
    grid-template-columns: minmax(0, 1fr) minmax(82px, auto) minmax(84px, 96px) minmax(72px, 96px);
}
.saving-throws-header span:nth-child(3),
.saving-throws-header span:nth-child(4) {
    justify-self: center;
    text-align: center;
}
@media (max-width: 560px) {
    .saving-throws-header {
        grid-template-columns: minmax(0, 1fr) minmax(64px, auto);
        grid-template-areas: 'bonus result';
        gap: 8px;
        padding: 0;
        text-align: left;
    }
    .saving-throws-header span:nth-child(1),
    .saving-throws-header span:nth-child(2) {
        display: none;
    }
    .saving-throws-header span:nth-child(3) {
        grid-area: bonus;
    }
    .saving-throws-header span:nth-child(4) {
        grid-area: result;
        justify-self: end;
    }
    .saving-throw-row {
        grid-template-columns: minmax(0, 1fr) minmax(64px, auto);
        grid-template-areas: 'title title' 'check check' 'bonus result';
        column-gap: 8px;
    }
    .saving-throw-row > div:first-child {
        grid-area: title;
    }
    .saving-throw-row > .c-check-control {
        grid-area: check;
        justify-self: start;
    }
    .saving-throw-row > :deep(.flex-col) {
        grid-area: bonus;
        min-width: 0;
        max-width: 100%;
    }
    .saving-throw-row > :deep(.flex-col .n-input) {
        width: 100%;
        min-width: 0;
    }
    .saving-throw-row > .saving-result {
        grid-area: result;
    }
    .saving-result {
        justify-self: end;
    }
}
@media (min-width: 801px) and (max-width: 1100px) {
    .saving-throws-header,
    .saving-throw-row {
        grid-template-columns: minmax(0, 1fr) minmax(82px, auto) minmax(84px, 96px) minmax(
                72px,
                96px
            );
        gap: 6px;
    }
}
</style>
