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
    if (!draft.value.name) return
    emit('save', { ...draft.value })
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <NFormItem label="Наименование">
            <NInput
                :value="draft.name"
                :disabled="disabled"
                @update:value="draft.name = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Описание">
            <NInput
                :value="draft.description"
                type="textarea"
                :disabled="disabled"
                rows="5"
                @update:value="draft.description = $event.trim()"
            />
        </NFormItem>
        <div class="flex flex-wrap justify-end items-center gap-2">
            <NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
            <NButton type="primary" :disabled="disabled || !draft.name" @click="submit">Сохранить</NButton>
        </div>
    </div>
</template>
