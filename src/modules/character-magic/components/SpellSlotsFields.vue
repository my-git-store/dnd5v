<script setup lang="ts">
import { NButton, NFormItem, NInputNumber } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterSpellSlot } from '@/types/character'

const { character, save } = useCharacterSheet()

function integerValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function updateMax(slot: CharacterSpellSlot, value: number | null) {
    slot.max = integerValue(value)
    slot.used = Math.min(slot.used, slot.max)
}

function changeUsed(slot: CharacterSpellSlot, delta: number) {
    const next = Math.min(slot.max, Math.max(0, slot.used + delta))
    if (next === slot.used) return
    slot.used = next
    save()
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3>Ресурс заклинаний</h3>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="(slot, level) in character.spellcasting.spellSlots" :key="level">
                <h3>Уровень {{ level }}</h3>
                <p>Доступно: {{ slot.max - slot.used }} из {{ slot.max }}</p>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NFormItem label="Макс.">
                        <NInputNumber button-placement="both" min="0" step="1" :value="slot.max"
                            @update:value="updateMax(slot, $event)" />
                    </NFormItem>
                    <NFormItem label="Использовано">
                        <NInputNumber button-placement="both" min="0" step="1" :value="slot.used"
                            @update:value="slot.used = Math.min(slot.max, integerValue($event))" />
                    </NFormItem>
                </div>
                <div class="flex flex-wrap gap-2">
                    <NButton :disabled="slot.used >= slot.max" @click="changeUsed(slot, 1)">
                        Потратить ячейку
                    </NButton>
                    <NButton :disabled="slot.used <= 0" @click="changeUsed(slot, -1)">
                        Вернуть ячейку
                    </NButton>
                </div>
            </div>
        </div>
    </section>
</template>
