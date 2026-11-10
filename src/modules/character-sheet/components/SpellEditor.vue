<script setup lang="ts">
import { ref, watch } from 'vue'

import type { CharacterSpell } from '../types/character'
const props = defineProps<{ spell: CharacterSpell; cantrip?: boolean; disabled?: boolean }>()

const emit = defineEmits<{ save: [spell: CharacterSpell]; cancel: [] }>()

const draft = ref({ ...props.spell })
watch(
    () => props.spell,
    value => {
        draft.value = { ...value }
    },
    { deep: true },
)
function submit() {
    if (!draft.value.name.trim()) return
    const level = props.cantrip
        ? 0
        : Math.min(9, Math.max(1, Math.trunc(Number(draft.value.level) || 1)))
    emit('save', { ...draft.value, name: draft.value.name.trim(), level })
}
</script>
<template>
    <div class="editor-grid">
        <NFormItem label="Название"
            ><NInput v-model:value="draft.name" :disabled="disabled" /></NFormItem
        ><NFormItem label="Уровень"
            ><NInputNumber
                v-if="!cantrip"
                v-model:value="draft.level"
                min="1"
                max="9"
                :disabled="disabled" /></NFormItem
        ><NFormItem label="Описание"
            ><NInput
                v-model:value="draft.description"
                type="textarea"
                :disabled="disabled"
                rows="3"
        /></NFormItem>
        <div class="editor-actions">
            <NButton type="primary" :disabled="disabled" @click="submit">Применить</NButton
            ><NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>
