<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CTextarea } from '@/ui/components'
import type { InventoryItem } from '../types/character'
const props = defineProps<{ item: InventoryItem; disabled?: boolean }>()
const emit = defineEmits<{ save: [item: InventoryItem]; cancel: [] }>()
const draft = ref({ ...props.item })
watch(() => props.item, (value) => { draft.value = { ...value } }, { deep: true })
function submit() { if (!draft.value.name.trim()) return; emit('save', { ...draft.value, name: draft.value.name.trim(), quantity: Math.max(0, Math.trunc(Number(draft.value.quantity) || 0)) }) }
</script>
<template><div class="editor-grid"><CInput v-model="draft.name" label="Название" :disabled="disabled" /><CInput v-model="draft.quantity" type="number" min="0" label="Количество" :disabled="disabled" /><CTextarea v-model="draft.description" label="Описание" :disabled="disabled" rows="2" /><div class="editor-actions"><CBtn color-type="primary" :disabled="disabled" @click="submit">Применить</CBtn><CBtn :disabled="disabled" @click="emit('cancel')">Отмена</CBtn></div></div></template>
