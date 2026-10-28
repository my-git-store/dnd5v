<script setup lang="ts">
import { ref } from 'vue'
import { CBtn } from '@/ui/components'
import type { StoredCharacterSummary } from '../api/characterV3Storage'

defineProps<{
  characters: StoredCharacterSummary[]
  activeId: string | null
  dirty: boolean
  disabled: boolean
  status?: { kind: 'success' | 'error'; text: string } | null
}>()

const emit = defineEmits<{
  select: [id: string]
  create: []
  copy: []
  remove: []
  'export-current': []
  'export-all': []
  'import-file': [file: File]
}>()
const fileInput = ref<HTMLInputElement | null>(null)
function chooseImport() { fileInput.value?.click() }
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('import-file', file)
}
</script>

<template>
  <section class="character-manager" aria-label="Управление персонажами">
    <div class="character-manager-copy">
      <span class="eyebrow">Персонажи</span>
      <strong v-if="characters.length">Выберите лист для работы</strong>
      <strong v-else>Персонажей пока нет</strong>
      <small v-if="dirty">Перед переключением сохраните изменения или подтвердите их отмену.</small>
    </div>
    <div class="character-manager-controls">
      <label class="character-manager-select-label">
        <span class="sr-only">Активный персонаж</span>
        <select class="select-control" :value="activeId ?? ''" :disabled="disabled || !characters.length" @change="emit('select', ($event.target as HTMLSelectElement).value)">
          <option v-if="!characters.length" value="">Нет сохранённых персонажей</option>
          <option v-for="item in characters" :key="item.id" :value="item.id">{{ item.name || 'Безымянный герой' }}<template v-if="item.className"> · {{ item.className }}</template></option>
        </select>
      </label>
      <CBtn color-type="accent" :disabled="disabled" @click="emit('create')">Новый</CBtn>
      <CBtn color-type="accent" :disabled="disabled || !activeId" @click="emit('copy')">Копировать</CBtn>
      <CBtn color-type="delete" :disabled="disabled || !activeId" @click="emit('remove')">Удалить</CBtn>
      <CBtn color-type="accent" :disabled="disabled || !activeId" @click="emit('export-current')">Экспорт</CBtn>
      <CBtn color-type="accent" :disabled="disabled || !characters.length" @click="emit('export-all')">Экспорт всех</CBtn>
      <CBtn color-type="accent" :disabled="disabled" @click="chooseImport">Импорт</CBtn>
      <input ref="fileInput" class="character-import-input" type="file" accept="application/json,.json" @change="onFileChange">
    </div>
    <p v-if="status" class="character-manager-status" :class="status.kind" role="status" aria-live="polite">{{ status.text }}</p>
  </section>
</template>
