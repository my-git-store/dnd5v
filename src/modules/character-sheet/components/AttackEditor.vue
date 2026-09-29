<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CTextarea } from '@/ui/components'
import type { CharacterAttack } from '../types/character'
const props = defineProps<{ attack: CharacterAttack; disabled?: boolean }>()
const emit = defineEmits<{ save: [attack: CharacterAttack]; cancel: [] }>()
const draft = ref({ ...props.attack })
watch(() => props.attack, (value) => { draft.value = { ...value } }, { deep: true })
function submit() { if (!draft.value.name.trim()) return; emit('save', { ...draft.value, name: draft.value.name.trim() }) }
</script>
<template>
  <div class="editor-grid">
    <CInput v-model="draft.name" label="Название" :disabled="disabled" />
    <CInput v-model="draft.attackBonus" label="Бонус атаки" :disabled="disabled" />
    <CInput v-model="draft.damage" label="Урон" :disabled="disabled" />
    <CTextarea v-model="draft.description" label="Описание" :disabled="disabled" rows="2" />
    <div class="editor-actions"><CBtn color-type="primary" :disabled="disabled" @click="submit">Применить</CBtn><CBtn :disabled="disabled" @click="emit('cancel')">Отмена</CBtn></div>
  </div>
</template>
