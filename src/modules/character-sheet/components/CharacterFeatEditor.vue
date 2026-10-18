<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CTextarea } from '@/ui/components'
import type { CharacterFeatV3 } from '../types/characterV3'

const props = defineProps<{ feat: CharacterFeatV3; disabled?: boolean }>()
const emit = defineEmits<{ save: [feat: CharacterFeatV3]; cancel: [] }>()
const draft = ref<CharacterFeatV3>({ ...props.feat })
watch(() => props.feat, (value) => { draft.value = { ...value } }, { deep: true })

function submit() {
  const name = draft.value.name.trim()
  if (!name) return
  emit('save', { id: draft.value.id, name, description: draft.value.description.trim() })
}
</script>

<template>
  <div class="editor-grid">
    <CInput v-model="draft.name" label="Наименование" :disabled="disabled" />
    <CTextarea v-model="draft.description" label="Описание" :disabled="disabled" rows="5" />
    <div class="editor-actions"><CBtn color-type="primary" :disabled="disabled || !draft.name.trim()" @click="submit">Сохранить</CBtn><CBtn :disabled="disabled" @click="emit('cancel')">Отмена</CBtn></div>
  </div>
</template>
