<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NFormItem, NInput, NInputNumber, NModal, NForm } from 'naive-ui'

import type { CharacterKnownSpellRecord } from '@/types/character'

export interface Props {
    spell?: CharacterKnownSpellRecord
    onSave: (spell: CharacterKnownSpellRecord) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

const draft = ref<CharacterKnownSpellRecord>(
    props.spell
        ? { ...props.spell }
        : {
            name: '',
            level: 1,
            description: '',
            school: '',
            castingTime: '',
            range: '',
            components: '',
            duration: '',
            concentration: false,
            ritual: false,
            prepared: false,
        },
)

function submit() {
    if (!draft.value.name) return
    props.onSave({ ...draft.value })
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" @update:show="emit('close')">
        <NCard class="w-full" :title="spell ? 'Редактирование заклинания' : 'Создание заклинания'">
            <NForm class="flex flex-col gap-4" @submit="submit">
                <div class="flex gap-4">
                    <NFormItem class="flex-1" label="Название">
                        <NInput :value="draft.name" @update:value="draft.name = $event.trim()" />
                    </NFormItem>
                    <NFormItem label="Уровень">
                        <NInputNumber :value="draft.level" button-placement="both" :min="1" :max="9" :precision="0"
                            @update:value="draft.level = $event ?? 1" />
                    </NFormItem>
                </div>
                <NFormItem label="Описание" class="sm:col-span-2">
                    <NInput :value="draft.description" type="textarea" :rows="3"
                        @update:value="draft.description = $event.trim()" />
                </NFormItem>
                <div class="flex flex-wrap items-center gap-2 sm:col-span-2">
                    <NButton type="primary" attr-type="submit" :disabled="!draft.name">
                        Применить
                    </NButton>
                    <NButton @click="emit('close')">Отмена</NButton>
                </div>
            </NForm>
        </NCard>
    </NModal>
</template>
