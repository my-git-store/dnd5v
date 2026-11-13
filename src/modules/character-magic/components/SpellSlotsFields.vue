<script setup lang="ts">
import { NButton, NFormItem, NInputNumber } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterSpellSlot } from '@/types/character'

const { character } = useCharacterSheet()

function integerValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

function updateMax(slot: CharacterSpellSlot, value: number | null) {
    slot.max = integerValue(value)
    slot.used = Math.min(slot.used, slot.max)
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Ресурс заклинаний</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="(slot, level) in character.spellcasting.spellSlots" :key="level">
                <h3>Уровень {{ level }}</h3>
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
                <p>Осталось: {{ Math.max(0, slot.max - slot.used) }}</p>
                <div class="flex flex-wrap items-center gap-2">
                    <NButton :disabled="slot.used >= slot.max"
                        @click="slot.used = Math.min(slot.max, slot.used + 1)">Потратить</NButton>
                    <NButton :disabled="slot.used <= 0" @click="slot.used = Math.max(0, slot.used - 1)">
                        Вернуть</NButton>
                </div>
            </div>
        </div>
    </section>
</template>
