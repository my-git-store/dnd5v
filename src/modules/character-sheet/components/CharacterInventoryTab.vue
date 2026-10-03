<script setup lang="ts">
import InventoryList from './InventoryList.vue'
import MoneyFields from './MoneyFields.vue'
import type { CharacterMoney } from '../types/character'
import type { CharacterSheetView } from '../types/characterView'
import type { CharacterInventoryItemV3 } from '../types/characterV3'

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{ 'update:inventory': [items: CharacterInventoryItemV3[]]; 'update:money': [money: CharacterMoney] }>()
</script>

<template>
  <div class="tab-content inventory-tab">
    <section class="sheet-section inventory-intro-panel">
      <div class="inventory-intro-mark" aria-hidden="true">◆</div>
      <div><p class="eyebrow">СНАРЯЖЕНИЕ ГЕРОЯ</p><h1>Инвентарь</h1><p class="section-note">Соберите здесь всё, что герой носит с собой: предметы, снаряжение и деньги.</p></div>
    </section>
    <InventoryList :items="character.inventoryData.items" :disabled="disabled" @update="emit('update:inventory', $event)" />
    <MoneyFields :money="character.inventoryData.money" :disabled="disabled" @update="emit('update:money', $event)" />
  </div>
</template>
