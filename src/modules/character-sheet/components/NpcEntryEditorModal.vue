<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CModal, CTextarea, useDialog } from '@/ui/components'
import type { CharacterNpcEntryV3 } from '../types/characterV3'

const props = defineProps<{ entry: CharacterNpcEntryV3; onSave: (entry: CharacterNpcEntryV3) => void }>()
const emit = defineEmits<{ close: [] }>()
const { close } = useDialog()
const draft = ref<CharacterNpcEntryV3>({ ...props.entry })
watch(() => props.entry, value => { draft.value = { ...value } }, { deep: true })
function save() {
  if (!draft.value.name.trim()) return
  props.onSave({ ...draft.value, name: draft.value.name.trim() })
  close()
}
</script>

<template>
  <CModal @close="emit('close')">
    <section class="character-editor-card npc-entry-editor" role="dialog" aria-modal="true" aria-label="Редактор записи НПС">
      <h2>{{ entry.id ? 'Редактирование записи' : 'Новая запись' }}</h2>
      <div class="editor-grid">
        <CInput v-model="draft.name" label="Название" />
        <CInput v-model="draft.attackBonus" label="Бонус атаки" />
        <CInput v-model="draft.damage" label="Формула урона" />
        <CTextarea v-model="draft.description" label="Описание" rows="4" />
      </div>
      <div class="editor-actions">
        <CBtn @click="close">Отмена</CBtn>
        <CBtn color-type="primary" :disabled="!draft.name.trim()" @click="save">Сохранить</CBtn>
      </div>
    </section>
  </CModal>
</template>
