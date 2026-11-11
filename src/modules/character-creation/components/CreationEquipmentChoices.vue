<script setup lang="ts">
import type { RuleEquipmentOption } from '@/types/rules'

type Props = {
    options: RuleEquipmentOption[]
    selectedId: string
    disabled?: boolean
    sigil?: string
    itemCountLabel?: string
}
type Emits = { select: [id: string] }
withDefaults(defineProps<Props>(), { sigil: '✧', itemCountLabel: 'позиций' })
const emit = defineEmits<Emits>()
</script>

<template>
    <div class="selection-grid equipment-selection-grid">
        <button
            v-for="kit in options"
            :key="kit.id"
            type="button"
            class="selection-card equipment-card"
            :class="{ selected: selectedId === kit.id }"
            :aria-pressed="selectedId === kit.id"
            :disabled="disabled"
            @click="emit('select', kit.id)"
        >
            <span class="selection-card-top"
                ><span class="selection-sigil" aria-hidden="true">{{ sigil }}</span
                ><span v-if="selectedId === kit.id" class="selection-check" aria-label="Выбрано"
                    >✓</span
                ></span
            >
            <strong>{{ kit.label }}</strong>
            <span class="equipment-card-items">{{
                kit.items.map(item => `${item.name} × ${item.quantity}`).join(' · ')
            }}</span>
            <span class="selection-description">{{ kit.items.length }} {{ itemCountLabel }}</span>
        </button>
    </div>
</template>

<style scoped src="./styles/creation-selection.css"></style>
<style scoped>
.equipment-selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.equipment-card {
    min-height: 150px;
}
.equipment-card-items {
    display: block;
    margin-top: 8px;
    color: #584532;
    font-size: 0.76rem;
    line-height: 1.45;
}
</style>
