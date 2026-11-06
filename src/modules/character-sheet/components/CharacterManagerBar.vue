<script setup lang="ts">
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
  'create-npc': []
  copy: []
  remove: []
  'export-current': []
  'export-all': []
  'import-file': [file: File]
}>()
</script>

<template>
  <section class="character-manager" aria-label="Управление персонажами">
    <div class="character-manager-copy">
      <span class="eyebrow">Персонажи</span>
      <strong v-if="characters.length">Текущий лист персонажа</strong>
      <strong v-else>Персонажей пока нет</strong>
      <small v-if="dirty">Есть несохранённые изменения.</small>
    </div>
    <div class="character-manager-controls">
      <CBtn color-type="accent" :disabled="disabled" @click="emit('create')">Создать персонажа</CBtn>
      <a class="c-btn c-btn-accent survey-link" href="https://forms.yandex.ru/u/6aec6367c45c070febaff5f5"
        target="_blank" rel="noopener noreferrer">Пройти опрос</a>
    </div>
    <p v-if="status" class="character-manager-status" :class="status.kind" role="status" aria-live="polite">{{
      status.text }}</p>
  </section>
</template>
