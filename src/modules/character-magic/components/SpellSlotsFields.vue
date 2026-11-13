<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NFormItem, NInputNumber } from 'naive-ui'

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
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2>Ресурс заклинаний</h2>
                <p>Отмечайте использованные ячейки. Остаток считается автоматически.</p>
            </div>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="item in labels" :key="item.level">
                <h3>{{ item.label }}</h3>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <p>Осталось: {{ remaining(item.level) }}</p>
                <div class="flex flex-wrap items-center gap-2">
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
