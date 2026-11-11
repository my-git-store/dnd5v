<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CharacterNpcEntry } from '../types/character'

const props = defineProps<{
    entry: CharacterNpcEntry
    onSave: (entry: CharacterNpcEntry) => void
}>()

const emit = defineEmits<{ close: [] }>()

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
            class="c-character-editor-card npc-entry-editor"
            role="dialog"
            aria-modal="true"
            aria-label="Редактор записи НПС"
        >
            <h2>{{ entry.id ? 'Редактирование записи' : 'Новая запись' }}</h2>
            <div class="c-editor-grid">
                <NFormItem label="Название"><NInput v-model:value="draft.name" /></NFormItem>
                <NFormItem label="Бонус атаки"
                    ><NInput v-model:value="draft.attackBonus"
                /></NFormItem>
                <NFormItem label="Формула урона"><NInput v-model:value="draft.damage" /></NFormItem>
                <NFormItem label="Описание"
                    ><NInput v-model:value="draft.description" type="textarea" rows="4"
                /></NFormItem>
            </div>
            <div class="c-editor-actions">
                <NButton @click="emit('close')">Отмена</NButton>
                <NButton type="primary" :disabled="!draft.name.trim()" @click="save"
                    >Сохранить</NButton
                >
            </div>
        </section>
    </NModal>
</template>

<style scoped>
.npc-entry-editor {
    width: min(620px, calc(100vw - 24px));
    max-height: calc(100vh - 24px);
    overflow: auto;
}
.npc-entry-editor .c-editor-grid {
    grid-template-columns: minmax(0, 1fr);
}
.npc-entry-editor :deep(.n-input-textarea) {
    min-height: 180px;
    resize: vertical;
    line-height: 1.55;
}
</style>
