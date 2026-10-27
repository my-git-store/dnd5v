<script setup lang="ts">
import { CBtn } from '@/ui/components'
import type { StoredCharacterSummary } from '../api/characterV3Storage'

defineProps<{
  characters: StoredCharacterSummary[]
  activeId: string | null
  dirty: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  create: []
  copy: []
  remove: []
}>()
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
    </div>
  </section>
</template>
