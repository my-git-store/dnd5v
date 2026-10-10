<script setup lang="ts">
import { computed, ref } from 'vue'
import { CBtn, openConfirmModal, useDialog } from '@/ui/components'
import { searchFilterObject } from '@/composables/useFilters'
import InventoryItemEditorModal from './InventoryItemEditorModal.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import CollectionSearch from './shared/CollectionSearch.vue'
import type { CharacterInventoryItemV3 } from '../types/characterV3'
import { getRules2024Weapon } from '../data/rules2024/index.ts'

const props = defineProps<{ items: CharacterInventoryItemV3[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [items: CharacterInventoryItemV3[]] }>()
const query = ref('')
const showEquipped = ref(true)
const showUnequipped = ref(true)
const { open } = useDialog()
const visibleItems = computed(() => {
  const search = query.value.trim()
  const matches = search ? searchFilterObject(props.items, ['name', 'description', 'properties'], search) : props.items
  return props.items.filter((item) => {
    const matchesSearch = matches.includes(item)
    const matchesEquipmentFilter = item.equipped ? showEquipped.value : showUnequipped.value
    return matchesSearch && matchesEquipmentFilter
  })
})
function save(item: CharacterInventoryItemV3) {
  const exists = props.items.some((current) => current.id === item.id)
  emit('update', exists ? props.items.map((current) => current.id === item.id ? item : current) : [...props.items, item])
}
function openEditor(item: CharacterInventoryItemV3) {
  open({ component: InventoryItemEditorModal, componentProps: { item: { ...item, properties: [...item.properties] }, disabled: props.disabled, onSave: save } })
}
function add() { openEditor({ id: `item-${Date.now()}`, name: '', quantity: 1, weight: null, description: '', equipped: false, properties: [] }) }
function remove(id: string, name: string) {
  openConfirmModal({ text: `удалить предмет «${name || 'без названия'}»?`, onOk: () => emit('update', props.items.filter((item) => item.id !== id)) })
}
</script>

<template>
  <section class="sheet-section inventory-ledger-section">
    <div class="section-heading"><h2>Предметы</h2><CBtn color-type="accent" :disabled="disabled" @click="add">Добавить</CBtn></div>
    <CollectionSearch v-model:query="query" label="Поиск по инвентарю" />
    <fieldset class="inventory-filter" :disabled="disabled">
      <legend>Показывать</legend>
      <label><input v-model="showEquipped" type="checkbox"><span>Экипированные</span></label>
      <label><input v-model="showUnequipped" type="checkbox"><span>Не экипированные</span></label>
    </fieldset>
    <EmptyCollection v-if="items.length === 0" text="Инвентарь пока пуст." />
    <EmptyCollection v-else-if="visibleItems.length === 0" text="Совпадений не найдено." />
    <div v-for="item in visibleItems" :key="item.id" class="entry-card inventory-entry-card">
      <div class="inventory-entry-content">
        <div class="inventory-title"><div><h3>{{ item.name || 'Без названия' }}</h3><span v-if="item.source === 'creation'" class="inventory-source-badge">Стартовый набор</span><span v-if="item.weaponId && getRules2024Weapon(item.weaponId)" class="inventory-source-badge">Оружие: {{ getRules2024Weapon(item.weaponId)?.name }}</span></div><span v-if="item.equipped" class="mode-tag mode-equipped">Экипировано</span></div>
        <div class="inventory-facts"><span>Количество: {{ item.quantity }}</span><span v-if="item.weight !== null">Вес: {{ item.weight }}</span></div>
        <p v-if="item.properties.length" class="inventory-meta">{{ item.properties.join(' · ') }}</p>
        <p v-if="item.description">{{ item.description }}</p>
      </div>
      <EntryActions :disabled="disabled" @edit="openEditor(item)" @remove="remove(item.id, item.name)" />
    </div>
  </section>
</template>
