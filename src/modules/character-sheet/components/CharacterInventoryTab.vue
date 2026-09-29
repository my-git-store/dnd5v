<script setup lang="ts">
import InventoryList from './InventoryList.vue'
import MoneyFields from './MoneyFields.vue'
import type { Character, CharacterMoney, InventoryItem } from '../types/character'
defineProps<{ character: Character; disabled?: boolean }>()
const emit = defineEmits<{ 'update:inventory': [items: InventoryItem[]]; 'update:money': [money: CharacterMoney] }>()
</script>
<template><div class="tab-content"><InventoryList :items="character.inventory" :disabled="disabled" @update="emit('update:inventory', $event)" /><MoneyFields :money="character.money" :disabled="disabled" @update="emit('update:money', $event)" /></div></template>
