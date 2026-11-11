<script setup lang="ts">
import { computed } from 'vue'

import { signedModifier } from '@/domain/abilityModifier'
import { calculateInitiative } from '@/domain/combatCalculations'
import type { CharacterAbilities } from '@/types/character'
import type { CharacterCombat } from '@/types/character'

type Emits = {
    update: [combat: CharacterCombat]
}

const props = defineProps<{
    combat: CharacterCombat
    abilities: CharacterAbilities
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const armorClass = computed(() => {
    return props.combat.armorClass.value
})

const initiative = computed(
    () => calculateInitiative(props.abilities, props.combat.initiative.additionalBonus) ?? 0,
)

const speed = computed(() => props.combat.speed.override ?? props.combat.speed.base)

function numberValue(value: unknown): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
}
function nullableNumber(value: unknown): number | null {
    return value === '' || value === null || value === undefined ? null : numberValue(value)
}
function copy(): CharacterCombat {
    return JSON.parse(JSON.stringify(props.combat)) as CharacterCombat
}
function updateArmorValue(value: unknown) {
    const next = copy()

    const parsed = numberValue(value)
    // Keep the character record intact while making a direct edit authoritative.
    // Existing computed values are shown first, then switch to manual on edit.
    next.armorClass.mode = 'manual'
    next.armorClass.value = parsed
    emit('update', next)
}
function updateInitiative(value: unknown) {
    const next = copy()
    next.initiative.additionalBonus = numberValue(value)
    emit('update', next)
}
function updateSpeed(key: keyof CharacterCombat['speed'], value: unknown) {
    const next = copy()
    if (key === 'base') next.speed.base = numberValue(value)
    else next.speed[key] = nullableNumber(value)
    emit('update', next)
}
function updateHitPoints(key: keyof CharacterCombat['hitPoints'], value: unknown) {
    const next = copy()
    next.hitPoints[key] = numberValue(value)
    emit('update', next)
}
function updateHitDice(key: keyof CharacterCombat['hitDice'], value: unknown) {
    const next = copy()
    if (key === 'size') next.hitDice.size = String(value ?? '')
    else next.hitDice[key] = numberValue(value)
    emit('update', next)
}
function updateDeathSave(key: keyof CharacterCombat['deathSaves'], value: unknown) {
    const next = copy()
    next.deathSaves[key] = numberValue(value)
    emit('update', next)
}
</script>

<template>
    <section class="c-sheet-section">
        <h2>Бой</h2>
        <div class="combat-grid">
            <div class="c-field-card combat-armor">
                <div class="combat-card-heading">
                    <h3>Класс доспеха</h3>
                    <p class="c-derived-value c-combat-result">{{ armorClass }}</p>
                    <span class="c-mode-tag mode-unset">Ручное значение</span>
                </div>
                <p class="c-field-caption">
                    Расчёт КД не настроен — укажите итоговое значение вручную.
                </p>
                <NFormItem label="КД"
                    ><NInputNumber
                        min="0"
                        step="1"
                        :value="armorClass"
                        :disabled="disabled"
                        @update:value="updateArmorValue"
                /></NFormItem>
            </div>
            <div class="c-field-card">
                <div class="combat-card-heading">
                    <h3>Инициатива</h3>
                    <p class="c-derived-value c-combat-result">{{ signedModifier(initiative) }}</p>
                    <span class="c-mode-tag mode-ready">Расчёт</span>
                </div>
                <p class="c-field-caption">Модификатор Ловкости + добавка</p>
                <NFormItem label="Доп. бонус инициативы"
                    ><NInputNumber
                        step="1"
                        :value="combat.initiative.additionalBonus"
                        :disabled="disabled"
                        @update:value="updateInitiative"
                /></NFormItem>
            </div>
            <div class="c-field-card">
                <div class="combat-card-heading">
                    <h3>Скорость</h3>
                    <p class="c-derived-value c-combat-result">{{ speed }}</p>
                </div>
                <div class="combat-subgrid">
                    <NFormItem label="Базовая"
                        ><NInputNumber
                            min="0"
                            :value="combat.speed.base"
                            :disabled="disabled"
                            @update:value="updateSpeed('base', $event)"
                    /></NFormItem>
                    <NFormItem label="Переопределение"
                        ><NInputNumber
                            min="0"
                            :value="combat.speed.override ?? null"
                            :disabled="disabled"
                            @update:value="updateSpeed('override', $event)"
                    /></NFormItem>
                    <NFormItem label="Полёт"
                        ><NInputNumber
                            min="0"
                            :value="combat.speed.fly ?? null"
                            :disabled="disabled"
                            @update:value="updateSpeed('fly', $event)"
                    /></NFormItem>
                    <NFormItem label="Плавание"
                        ><NInputNumber
                            min="0"
                            :value="combat.speed.swim ?? null"
                            :disabled="disabled"
                            @update:value="updateSpeed('swim', $event)"
                    /></NFormItem>
                </div>
            </div>
            <div class="c-field-card">
                <div class="combat-card-heading">
                    <h3>Хиты</h3>
                    <p class="c-derived-value c-combat-result">
                        {{ combat.hitPoints.current }} / {{ combat.hitPoints.max }}
                    </p>
                </div>
                <div class="combat-subgrid">
                    <NFormItem label="Максимум"
                        ><NInputNumber
                            min="0"
                            step="1"
                            :value="combat.hitPoints.max"
                            :disabled="disabled"
                            @update:value="updateHitPoints('max', $event)"
                    /></NFormItem>
                    <NFormItem label="Текущие"
                        ><NInputNumber
                            min="0"
                            step="1"
                            :value="combat.hitPoints.current"
                            :disabled="disabled"
                            @update:value="updateHitPoints('current', $event)"
                    /></NFormItem>
                    <NFormItem label="Временные"
                        ><NInputNumber
                            min="0"
                            step="1"
                            :value="combat.hitPoints.temporary"
                            :disabled="disabled"
                            @update:value="updateHitPoints('temporary', $event)"
                    /></NFormItem>
                </div>
            </div>
            <div class="c-field-card">
                <div class="combat-card-heading">
                    <h3>Кости хитов</h3>
                    <p class="c-derived-value c-combat-result">
                        {{ combat.hitDice.spent }} / {{ combat.hitDice.total }}
                    </p>
                </div>
                <div class="combat-subgrid">
                    <NFormItem label="Размер (например, d8)"
                        ><NInput
                            :value="combat.hitDice.size"
                            :disabled="disabled"
                            @update:value="updateHitDice('size', $event)"
                    /></NFormItem>
                    <NFormItem label="Всего"
                        ><NInputNumber
                            min="0"
                            step="1"
                            :value="combat.hitDice.total"
                            :disabled="disabled"
                            @update:value="updateHitDice('total', $event)"
                    /></NFormItem>
                    <NFormItem label="Потрачено"
                        ><NInputNumber
                            min="0"
                            step="1"
                            :value="combat.hitDice.spent"
                            :disabled="disabled"
                            @update:value="updateHitDice('spent', $event)"
                    /></NFormItem>
                </div>
            </div>
            <div class="c-field-card">
                <div class="combat-card-heading">
                    <h3>Спасброски от смерти</h3>
                    <p class="c-derived-value c-combat-result">
                        {{ combat.deathSaves.successes }} / 3 · {{ combat.deathSaves.failures }} / 3
                    </p>
                </div>
                <div class="combat-subgrid">
                    <NFormItem label="Успехи"
                        ><NInputNumber
                            min="0"
                            max="3"
                            step="1"
                            :value="combat.deathSaves.successes"
                            :disabled="disabled"
                            @update:value="updateDeathSave('successes', $event)"
                    /></NFormItem>
                    <NFormItem label="Провалы"
                        ><NInputNumber
                            min="0"
                            max="3"
                            step="1"
                            :value="combat.deathSaves.failures"
                            :disabled="disabled"
                            @update:value="updateDeathSave('failures', $event)"
                    /></NFormItem>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.combat-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}
.combat-grid .c-field-card {
    display: grid;
    align-content: start;
    gap: 8px;
}
.combat-grid .c-field-card > h3 {
    min-height: 2.4em;
    display: flex;
    align-items: flex-start;
}
.combat-card-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
}
.combat-card-heading h3 {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.combat-card-heading .c-combat-result {
    flex: 0 0 auto;
    white-space: nowrap;
}
.combat-grid .c-field-card > .c-field-caption {
    min-height: 2.5em;
}
.combat-grid .c-field-card > .c-combat-result {
    display: flex;
    align-items: center;
    min-height: 1.8em;
}
.combat-grid .c-field-card > :deep(.n-input-wrapper),
.combat-grid .c-field-card > .combat-subgrid {
    margin-top: auto;
}
.combat-subgrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}
</style>
