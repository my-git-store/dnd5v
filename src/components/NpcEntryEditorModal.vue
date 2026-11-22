<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CharacterNpcEntry } from '../types/character'

type Emits = {
    close: []
}

const props = defineProps<{
    entry: CharacterNpcEntry
    onSave: (entry: CharacterNpcEntry) => void
}>()

const emit = defineEmits<Emits>()

const draft = ref<CharacterNpcEntry>({ ...props.entry })
watch(
    () => props.entry,
    value => {
        draft.value = { ...value }
    },
    { deep: true },
)
function save() {
    if (!draft.value.name.trim()) return
    props.onSave({ ...draft.value, name: draft.value.name.trim() })
    emit('close')
}
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')">
        <section
            class="w-full max-w-xl max-h-[90vh] overflow-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Редактор записи НПС"
        >
            <h2>{{ entry.id ? 'Редактирование записи' : 'Новая запись' }}</h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <NFormItem label="Название"><NInput v-model:value="draft.name" /></NFormItem>
                <NFormItem label="Бонус атаки"
                    ><NInput v-model:value="draft.attackBonus"
                /></NFormItem>
                <NFormItem label="Формула урона"><NInput v-model:value="draft.damage" /></NFormItem>
                <NFormItem label="Описание"
                    ><NInput v-model:value="draft.description" type="textarea" rows="4"
                /></NFormItem>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <NButton @click="emit('close')">Отмена</NButton>
                <NButton type="primary" :disabled="!draft.name.trim()" @click="save"
                    >Сохранить</NButton
                >
            </div>
        </section>
    </NModal>
</template>
