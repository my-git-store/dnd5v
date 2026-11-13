<script setup lang="ts">
import InventoryList from './InventoryList.vue'
import MoneyFields from './MoneyFields.vue'
import type { CharacterMoney } from '@/types/character'
import type { Character } from '@/types/character'
import type { CharacterInventoryItemRecord } from '@/types/character'

type Emits = {
    'update:inventory': [items: CharacterInventoryItemRecord[]]
    'update:money': [money: CharacterMoney]
    'use-item': [id: string]
}

defineProps<{ character: Character; disabled?: boolean }>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div class="grid gap-4">
        <InventoryList :items="character.inventory.items" :disabled="disabled"
            @update="emit('update:inventory', $event)" @use-item="emit('use-item', $event)" />
        <MoneyFields :money="character.inventory.money" :disabled="disabled"
            @update="emit('update:money', $event)" />
    </div>
</template>
