<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CTextarea } from '@/ui/components'
import type { CharacterSpell } from '../types/character'
const props = defineProps<{ spell: CharacterSpell; cantrip?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ save: [spell: CharacterSpell]; cancel: [] }>()
const draft = ref({ ...props.spell })
watch(() => props.spell, (value) => { draft.value = { ...value } }, { deep: true })
function submit() { if (!draft.value.name.trim()) return; const level = props.cantrip ? 0 : Math.min(9, Math.max(1, Math.trunc(Number(draft.value.level) || 1))); emit('save', { ...draft.value, name: draft.value.name.trim(), level }) }
</script>
<template>
  <div class="editor-grid"><CInput v-model="draft.name" label="Название" :disabled="disabled" /><CInput v-if="!cantrip" v-model="draft.level" type="number" min="1" max="9" label="Уровень" :disabled="disabled" /><CTextarea v-model="draft.description" label="Описание" :disabled="disabled" rows="3" /><div class="editor-actions"><CBtn color-type="primary" :disabled="disabled" @click="submit">Применить</CBtn><CBtn :disabled="disabled" @click="emit('cancel')">Отмена</CBtn></div></div>
</template>
