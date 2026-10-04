<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CTextarea } from '@/ui/components'
import { RULES_2024_WEAPONS } from '../data/rules2024/index.ts'
import type { CharacterInventoryItemV3 } from '../types/characterV3'

const props = defineProps<{ item: CharacterInventoryItemV3; disabled?: boolean }>()
const emit = defineEmits<{ save: [item: CharacterInventoryItemV3]; cancel: [] }>()
const draft = ref<CharacterInventoryItemV3>({ ...props.item, properties: [...props.item.properties] })
watch(() => props.item, (value) => { draft.value = { ...value, properties: [...value.properties] } }, { deep: true })
function integer(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0 }
function weight(value: unknown) { if (value === '' || value === null || value === undefined) return null; const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, parsed) : null }
function updateProperties(value: unknown) { draft.value.properties = String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean) }
function updateWeapon(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  draft.value.weaponId = id || undefined
}
function submit() {
  if (!draft.value.name.trim()) return
  emit('save', { ...draft.value, name: draft.value.name.trim(), quantity: integer(draft.value.quantity), weight: weight(draft.value.weight), properties: [...draft.value.properties] })
}
</script>

<template>
  <div class="editor-grid">
    <CInput v-model="draft.name" label="Название" :disabled="disabled" />
    <label class="compact-field">Связь с оружием
      <select class="select-control" :value="draft.weaponId ?? ''" :disabled="disabled" @change="updateWeapon"><option value="">Не оружие / без связи</option><option v-for="weapon in RULES_2024_WEAPONS" :key="weapon.id" :value="weapon.id">{{ weapon.name }}</option></select>
    </label>
    <CInput v-model="draft.quantity" type="number" min="0" step="1" label="Количество" :disabled="disabled" />
    <CInput type="number" min="0" step="0.01" label="Вес" :model-value="draft.weight ?? ''" :disabled="disabled" @update:model-value="draft.weight = weight($event)" />
    <label class="check-control inventory-check"><input v-model="draft.equipped" type="checkbox" :disabled="disabled"><span>Экипировано</span></label>
    <CInput label="Свойства через запятую" :model-value="draft.properties.join(', ')" :disabled="disabled" @update:model-value="updateProperties" />
    <CTextarea v-model="draft.description" label="Описание" :disabled="disabled" rows="3" />
    <div class="editor-actions"><CBtn color-type="primary" :disabled="disabled" @click="submit">Применить</CBtn><CBtn :disabled="disabled" @click="emit('cancel')">Отмена</CBtn></div>
  </div>
</template>
