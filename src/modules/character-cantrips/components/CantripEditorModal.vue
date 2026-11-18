<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NFormItem, NInput, NModal } from 'naive-ui'

import type { CharacterSpellRecord } from '@/types/character'

export interface Props {
    cantrip?: CharacterSpellRecord
    onSave: (cantrip: CharacterSpellRecord) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const draft = ref<CharacterSpellRecord>(
    props.cantrip
        ? { ...props.cantrip }
        : {
              name: '',
              level: 0,
              description: '',
              school: '',
              castingTime: '',
              range: '',
              components: '',
              duration: '',
              concentration: false,
              ritual: false,
          },
)

function submit() {
    if (!draft.value.name) return
    props.onSave({ ...draft.value, level: 0 })
    emit('close')
}
</script>

<template>
    <NModal
        :show="true"
        class="w-full max-w-3xl max-h-[90vh] overflow-auto"
        @update:show="emit('close')"
    >
        <NCard class="w-full" :title="cantrip ? 'Редактирование заговора' : 'Создание заговора'">
            <form class="flex flex-col gap-3" @submit.prevent="submit">
                <NFormItem label="Название">
                    <NInput :value="draft.name" @update:value="draft.name = $event.trim()" />
                </NFormItem>
                <NFormItem label="Описание">
                    <NInput
                        :value="draft.description"
                        type="textarea"
                        :rows="3"
                        @update:value="draft.description = $event.trim()"
                    />
                </NFormItem>
                <div class="flex flex-wrap items-center gap-2">
                    <NButton type="primary" native-type="submit" :disabled="!draft.name">
                        Применить
                    </NButton>
                    <NButton @click="emit('close')">Отмена</NButton>
                </div>
            </form>
        </NCard>
    </NModal>
</template>
