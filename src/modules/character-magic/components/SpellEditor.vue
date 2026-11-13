<script setup lang="ts">
import { ref, watch } from 'vue'

import type { CharacterSpellRecord } from '@/types/character'

type Emits = {
    save: [spell: CharacterSpellRecord]
    cancel: []
}

const props = defineProps<{ spell: CharacterSpellRecord; cantrip?: boolean; disabled?: boolean }>()

const emit = defineEmits<Emits>()

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
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NFormItem label="Название">
            <NInput v-model:value="draft.name" :disabled="disabled" />
        </NFormItem>
        <NFormItem label="Уровень">
            <NInputNumber
                v-if="!cantrip"
                v-model:value="draft.level"
                button-placement="both"
                min="1"
                max="9"
                :disabled="disabled"
            />
        </NFormItem>
        <NFormItem label="Описание">
            <NInput
                v-model:value="draft.description"
                type="textarea"
                :disabled="disabled"
                rows="3"
            />
        </NFormItem>
        <div class="flex flex-wrap items-center gap-2">
            <NButton type="primary" :disabled="disabled" @click="submit">Применить</NButton>
            <NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>
