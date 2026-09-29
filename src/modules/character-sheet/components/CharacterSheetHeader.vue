<script setup lang="ts">
import { CBtn, CInput } from '@/ui/components'
defineProps<{ dirty: boolean; saving: boolean; saved: boolean; saveError: string | null }>()
const name = defineModel<string>('name', { required: true })
const emit = defineEmits<{ save: [] }>()
</script>
<template>
  <header class="sheet-header">
    <div>
      <p class="eyebrow">Nastolka · Лист персонажа D&amp;D 5e</p>
      <CInput v-model="name" :disabled="saving" aria-label="Имя персонажа" placeholder="Имя персонажа" />
      <p v-if="dirty" class="status-text">Есть несохранённые изменения</p>
      <p v-else-if="saved" class="status-text success">Сохранено</p>
      <p v-if="saveError" class="status-text error">{{ saveError }}</p>
    </div>
    <CBtn color-type="primary" :loading="saving" :disabled="!dirty" @click="emit('save')">Сохранить</CBtn>
  </header>
</template>
