<script setup lang="ts">
import { computed } from 'vue'

import type { CharacterSpellSlot, CharacterSpellSlots } from '@/types/character'

type Emits = {
    update: [slots: CharacterSpellSlots]
    'use-slot': [level: (typeof levels)[number], delta: number]
}

const props = defineProps<{ slots: CharacterSpellSlots; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

function copy(): CharacterSpellSlots {
    return JSON.parse(JSON.stringify(props.slots)) as CharacterSpellSlots
}
function integer(value: unknown) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
}
function update(level: (typeof levels)[number], field: keyof CharacterSpellSlot, value: unknown) {
    const next = copy()

    const slot = next[level]
    if (field === 'max') {
        slot.max = integer(value)
        slot.used = Math.min(slot.used, slot.max)
    } else slot.used = Math.min(slot.max, integer(value))
    emit('update', next)
}
function remaining(level: (typeof levels)[number]) {
    const slot = props.slots[level]
    return Math.max(0, slot.max - slot.used)
}

const labels = computed(() => levels.map(level => ({ level, label: `Уровень ${level}` })))
</script>

<template>
    <section class="c-sheet-section">
        <div class="c-section-heading c-section-heading-stack">
            <div>
                <h2>Ресурс заклинаний</h2>
                <p class="c-section-note">
                    Отмечайте использованные ячейки. Остаток считается автоматически.
                </p>
            </div>
        </div>
        <div class="spell-slots-grid">
            <div v-for="item in labels" :key="item.level" class="c-field-card spell-slot-card">
                <h3>{{ item.label }}</h3>
                <div class="spell-slot-fields">
                    <NFormItem label="Макс."
                        ><NInputNumber
                            button-placement="both"
                            min="0"
                            step="1"
                            :value="slots[item.level].max"
                            :disabled="disabled"
                            @update:value="update(item.level, 'max', $event)"
                    /></NFormItem>
                    <NFormItem label="Использовано"
                        ><NInputNumber
                            button-placement="both"
                            min="0"
                            step="1"
                            :value="slots[item.level].used"
                            :disabled="disabled"
                            @update:value="update(item.level, 'used', $event)"
                    /></NFormItem>
                </div>
                <p class="c-derived-value">Осталось: {{ remaining(item.level) }}</p>
                <div class="spell-slot-actions">
                    <NButton
                        :disabled="disabled || slots[item.level].used >= slots[item.level].max"
                        @click="emit('use-slot', item.level, 1)"
                        >Потратить</NButton
                    >
                    <NButton
                        :disabled="disabled || slots[item.level].used <= 0"
                        @click="emit('use-slot', item.level, -1)"
                        >Вернуть</NButton
                    >
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.c-character-sheet .spell-slot-card {
    row-gap: 12px;
}
.c-character-sheet .spell-slot-fields :deep(.flex-col) {
    row-gap: 12px !important;
}
.spell-slots-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}
.spell-slot-card {
    display: grid;
    gap: 8px;
}
.spell-slot-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}
.spell-slot-card .c-derived-value {
    margin: 0;
    color: #6d4f31;
    font-size: 0.85rem;
}
.spell-slot-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
}
.spell-slot-card,
.spell-slot-fields,
.spell-slot-fields > :deep(.flex-col),
.spell-slot-fields :deep(.n-input) {
    min-width: 0;
}
.spell-slots-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.spell-slot-fields {
    align-items: start;
}
.spell-slot-fields > :deep(.flex-col > label) {
    display: block;
    min-height: 2.4em;
    line-height: 1.2;
    overflow-wrap: normal;
    word-break: normal;
}
</style>
