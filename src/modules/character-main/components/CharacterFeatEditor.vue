<script setup lang="ts">
import { ref, watch } from 'vue'

import type { CharacterFeat } from '@/types/character'

const props = defineProps<{ feat: CharacterFeat; disabled?: boolean }>()

const emit = defineEmits<{ save: [feat: CharacterFeat]; cancel: [] }>()

const draft = ref<CharacterFeat>({ ...props.feat })
watch(
    () => props.feat,
    value => {
        draft.value = { ...value }
    },
    { deep: true },
)

function submit() {
    const name = draft.value.name.trim()
    if (!name) return
    emit('save', { id: draft.value.id, name, description: draft.value.description.trim() })
}
</script>

<template>
    <div class="c-editor-grid">
        <NFormItem label="Наименование"
            ><NInput v-model:value="draft.name" :disabled="disabled"
        /></NFormItem>
        <NFormItem label="Описание"
            ><NInput
                v-model:value="draft.description"
                type="textarea"
                :disabled="disabled"
                rows="5"
        /></NFormItem>
        <div class="c-editor-actions">
            <NButton type="primary" :disabled="disabled || !draft.name.trim()" @click="submit"
                >Сохранить</NButton
            ><NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>
