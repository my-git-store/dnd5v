<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NFormItem, NInput } from 'naive-ui'

import type { CharacterFeat } from '@/types/character'

type Emits = {
    save: [feat: CharacterFeat]
    cancel: []
}

const props = defineProps<{ feat: CharacterFeat; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const draft = ref({ ...props.feat })

function submit() {
    const name = draft.value.name.trim()
    if (!name) return
    emit('save', { id: draft.value.id, name, description: draft.value.description.trim() })
}
</script>

<template>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div class="flex flex-wrap items-center gap-2">
            <NButton type="primary" :disabled="disabled || !draft.name.trim()" @click="submit"
                >Сохранить</NButton
            ><NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>
