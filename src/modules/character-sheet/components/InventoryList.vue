<script setup lang="ts">
import { computed, ref } from 'vue'
import { CBtn, openConfirmModal } from '@/ui/components'
import { searchFilterObject } from '@/composables/useFilters'
import InventoryItemEditor from './InventoryItemEditor.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import CollectionSearch from './shared/CollectionSearch.vue'
import type { CharacterInventoryItemV3 } from '../types/characterV3'

const props = defineProps<{ items: CharacterInventoryItemV3[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [items: CharacterInventoryItemV3[]] }>()
const editingId = ref<string | null>(null)
const draft = ref<CharacterInventoryItemV3 | null>(null)
const query = ref('')
const visibleItems = computed(() => {
  const search = query.value.trim()
  if (!search) return props.items
  const matches = searchFilterObject(props.items, ['name', 'description', 'properties'], search)
  return props.items.filter((item) => item.id === editingId.value || matches.includes(item))
})
function begin(item: CharacterInventoryItemV3) { editingId.value = item.id; draft.value = { ...item, properties: [...item.properties] } }
function add() { const item: CharacterInventoryItemV3 = { id: `item-${Date.now()}`, name: '', quantity: 1, weight: null, description: '', equipped: false, properties: [] }; draft.value = item; editingId.value = item.id }
function save(item: CharacterInventoryItemV3) { const exists = props.items.some((current) => current.id === item.id); emit('update', exists ? props.items.map((current) => current.id === item.id ? item : current) : [...props.items, item]); editingId.value = null; draft.value = null }
function remove(id: string, name: string) {
  openConfirmModal({ text: `удалить предмет «${name || 'без названия'}»?`, onOk: () => emit('update', props.items.filter((item) => item.id !== id)) })
}
</script>

<template>
  <section class="sheet-section inventory-ledger-section">
    <div class="section-heading"><h2>Предметы</h2><CBtn color-type="accent" :disabled="disabled || editingId !== null" @click="add">Добавить</CBtn></div>
    <CollectionSearch v-model:query="query" label="Поиск по инвентарю" />
    <EmptyCollection v-if="items.length === 0" text="Инвентарь пока пуст." />
    <EmptyCollection v-else-if="visibleItems.length === 0" text="Совпадений не найдено." />
    <div v-for="item in visibleItems" :key="item.id" class="entry-card inventory-entry-card">
      <InventoryItemEditor v-if="editingId === item.id && draft" :item="draft" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
      <template v-else>
        <div class="inventory-entry-content">
          <div class="inventory-title"><div><h3>{{ item.name || 'Без названия' }}</h3><span v-if="item.source === 'creation'" class="inventory-source-badge">Стартовый набор</span></div><span v-if="item.equipped" class="mode-tag mode-equipped">Экипировано</span></div>
          <div class="inventory-facts"><span>Количество: {{ item.quantity }}</span><span v-if="item.weight !== null">Вес: {{ item.weight }}</span></div>
          <p v-if="item.properties.length" class="inventory-meta">{{ item.properties.join(' · ') }}</p>
          <p v-if="item.description">{{ item.description }}</p>
        </div>
        <EntryActions :disabled="disabled" @edit="begin(item)" @remove="remove(item.id, item.name)" />
      </template>
    </div>
    <InventoryItemEditor v-if="editingId && !items.some((item) => item.id === editingId) && draft" :item="draft" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
  </section>
</template>
