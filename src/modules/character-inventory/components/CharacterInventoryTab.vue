<script setup lang="ts">
import InventoryList from './InventoryList.vue'
import MoneyFields from './MoneyFields.vue'
import { useCharacterInventory } from '../composables/useCharacterInventory'
import type { Character } from '@/types/character'

type Emits = {
    'use-item': [id: string]
}

defineProps<{ character: Character; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const { updateInventory, updateMoney } = useCharacterInventory()
</script>

<template>
    <div class="grid gap-4">
        <InventoryList :items="character.inventory.items" :disabled="disabled"
            @update="updateInventory" @use-item="emit('use-item', $event)" />
        <MoneyFields :money="character.inventory.money" :disabled="disabled"
            @update="updateMoney" />
    </div>
</template>
