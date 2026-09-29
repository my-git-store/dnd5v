<script setup lang="ts">
import { ref } from 'vue'
import { CBtn } from '@/ui/components'
import InventoryItemEditor from './InventoryItemEditor.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import type { InventoryItem } from '../types/character'
const props = defineProps<{ items: InventoryItem[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [items: InventoryItem[]] }>()
const editingId = ref<string | null>(null)
const draft = ref<InventoryItem | null>(null)
function begin(item: InventoryItem) { editingId.value = item.id; draft.value = { ...item } }
function add() { const item = { id: `item-${Date.now()}`, name: '', quantity: 1, description: '' }; draft.value = item; editingId.value = item.id }
function save(item: InventoryItem) { const exists = props.items.some((current) => current.id === item.id); emit('update', exists ? props.items.map((current) => current.id === item.id ? item : current) : [...props.items, item]); editingId.value = null; draft.value = null }
function remove(id: string) { if (window.confirm('Удалить этот предмет?')) emit('update', props.items.filter((item) => item.id !== id)) }
</script>
<template><section class="sheet-section"><div class="section-heading"><h2>Предметы</h2><CBtn color-type="accent" :disabled="disabled || editingId !== null" @click="add">Добавить</CBtn></div><EmptyCollection v-if="items.length === 0" text="Инвентарь пока пуст." /><div v-for="item in items" :key="item.id" class="entry-card"><InventoryItemEditor v-if="editingId === item.id && draft" :item="draft" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" /><template v-else><div><h3>{{ item.name }}</h3><p>Количество: {{ item.quantity }}</p><p v-if="item.description">{{ item.description }}</p></div><EntryActions :disabled="disabled" @edit="begin(item)" @remove="remove(item.id)" /></template></div><InventoryItemEditor v-if="editingId && !items.some((item) => item.id === editingId) && draft" :item="draft" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" /></section></template>
