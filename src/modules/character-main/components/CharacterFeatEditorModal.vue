<script setup lang="ts">
import CharacterFeatEditor from './CharacterFeatEditor.vue'
import type { CharacterFeat } from '@/types/character'

const props = defineProps<{
    feat: CharacterFeat
    disabled?: boolean
    onSave: (feat: CharacterFeat) => void
}>()

const emit = defineEmits<{ close: [] }>()

function save(feat: CharacterFeat) {
    props.onSave(feat)
    emit('close')
}
function cancel() {
    emit('close')
}
</script>

<template>
    <NModal
        :show="true"
        class="c-character-editor-modal character-feat-editor-modal"
        :on-close="cancel"
    >
        <NCard class="c-character-editor-card">
            <template #header>Черта персонажа</template>
            <CharacterFeatEditor :feat="feat" :disabled="disabled" @save="save" @cancel="cancel" />
        </NCard>
    </NModal>
</template>

<style scoped>
.character-feat-editor-modal {
    width: min(760px, calc(100vw - 24px));
    max-height: calc(100vh - 24px);
    overflow: auto;
}
.character-feat-editor-modal .c-character-editor-card {
    max-width: 100%;
    box-sizing: border-box;
}
.character-feat-editor-modal :deep(.c-editor-actions) {
    flex-wrap: wrap;
}
.character-feat-editor-modal :deep(.n-input-textarea) {
    min-height: 180px;
    height: auto;
    line-height: 1.55;
    resize: vertical;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
</style>
