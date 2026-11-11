<script setup lang="ts">
import InventoryList from './InventoryList.vue'
import MoneyFields from './MoneyFields.vue'
import type { CharacterMoney } from '@/types/character'
import type { CharacterSheetView } from '@/types/characterView'
import type { CharacterInventoryItemRecord } from '@/types/character'

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{
    'update:inventory': [items: CharacterInventoryItemRecord[]]
    'update:money': [money: CharacterMoney]
    'use-item': [id: string]
}>()
</script>

<template>
    <div class="c-tab-content inventory-tab">
        <section class="c-sheet-section inventory-intro-panel">
            <div class="inventory-intro-mark" aria-hidden="true">◆</div>
            <div>
                <h1>Инвентарь</h1>
                <p class="c-section-note">
                    Соберите здесь всё, что герой носит с собой: предметы, снаряжение и деньги.
                </p>
            </div>
        </section>
        <InventoryList
            :items="character.inventoryData.items"
            :disabled="disabled"
            @update="emit('update:inventory', $event)"
            @use-item="emit('use-item', $event)"
        />
        <MoneyFields
            :money="character.inventoryData.money"
            :disabled="disabled"
            @update="emit('update:money', $event)"
        />
    </div>
</template>

<style scoped>
.inventory-tab {
    grid-template-columns: minmax(0, 1.8fr) minmax(260px, 0.9fr);
    align-items: start;
}
.inventory-tab > .c-sheet-section:nth-child(2) :deep(.money-grid) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 9px;
}
.inventory-intro-panel {
    display: flex;
    align-items: center;
    gap: 14px;
    grid-column: 1 / -1;
    background: linear-gradient(135deg, rgba(255, 250, 239, 0.96), rgba(244, 226, 194, 0.76));
}
.inventory-intro-mark {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border: 1px solid #c6a56c;
    border-radius: 12px 12px 12px 3px;
    font-size: 1.25rem;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.48);
    color: #704b46;
    background: #f6e6d5;
}
.inventory-intro-panel h1 {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1.35rem;
}
.inventory-intro-panel :deep(.c-eyebrow) {
    margin-bottom: 4px;
    font-size: 0.62rem;
}
.inventory-tab > .c-sheet-section:nth-child(3) :deep(.money-grid) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 9px;
}
.inventory-intro-mark {
    border-color: #bd9a61;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.5),
        0 2px 5px rgba(83, 59, 38, 0.06);
}
.inventory-intro-panel {
    border-color: #c4a474;
    background: linear-gradient(135deg, rgba(255, 250, 239, 0.94), rgba(243, 224, 190, 0.78));
}
.inventory-intro-panel h1 {
    color: var(--sheet-burgundy);
}
.inventory-tab > .c-sheet-section:nth-child(3) :deep(.money-grid) {
    grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
}
</style>
