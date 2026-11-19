<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NCheckbox, NFormItem, NInput, NInputNumber, NModal, NForm } from 'naive-ui'

import type { CharacterInventoryItemRecord } from '@/types/character'

export interface Props {
    item?: CharacterInventoryItemRecord
    disabled?: boolean
    onSave: (item: CharacterInventoryItemRecord) => void
    onCancel?: () => void
}

type Emits = {
    close: [],
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const draft = ref<CharacterInventoryItemRecord>(
    props.item
        ? { ...props.item }
        : {
            name: '',
            quantity: 1,
            weight: null,
            description: '',
            equipped: false,
            properties: '',
        },
)

function submit() {
    console.log('!!!')
    props.onSave({
        ...draft.value,
    })
    emit('close')
}

function cancel() {
    props.onCancel?.()
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" @update:show="cancel">
        <NCard class="w-full" :title="item ? 'Редактирование предмета' : 'Создание предмета'">
            <NForm class="flex flex-col" @submit.prevent="submit">
                <NFormItem label="Название">
                    <NInput
                        :value="draft.name"
                        :disabled="disabled"
                        @update:value="draft.name = $event.trim()"
                    />
                </NFormItem>
                <div class="flex gap-4">
                    <NFormItem label="Количество">
                        <NInputNumber :value="draft.quantity" button-placement="both" :min="0" :step="1" :precision="0"
                            :disabled="disabled" @update:value="draft.quantity = $event ?? 0" />
                    </NFormItem>
                    <NFormItem label="Вес">
                        <NInputNumber v-model:value="draft.weight" button-placement="both" :min="0" :step="0.01"
                            :disabled="disabled" />
                    </NFormItem>
                </div>
                <NFormItem>
                    <NCheckbox v-model:checked="draft.equipped" :disabled="disabled">
                        Экипировано
                    </NCheckbox>
                </NFormItem>
                <NFormItem label="Свойства">
                    <NInput
                        :value="draft.properties"
                        :disabled="disabled"
                        @update:value="draft.properties = $event.trim()"
                    />
                </NFormItem>
                <NFormItem label="Описание">
                    <NInput
                        :value="draft.description"
                        type="textarea"
                        :disabled="disabled"
                        :rows="3"
                        @update:value="draft.description = $event.trim()"
                    />
                </NFormItem>
                <div class="flex flex-wrap items-center gap-2">
                    <NButton type="primary" attr-type="submit" :disabled="disabled || !draft.name">
                        Применить
                    </NButton>
                    <NButton :disabled="disabled" @click="cancel">Отмена</NButton>
                </div>
            </NForm>
        </NCard>
    </NModal>
</template>
