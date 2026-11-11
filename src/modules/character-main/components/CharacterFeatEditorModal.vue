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
        class="character-editor-modal character-feat-editor-modal"
        :on-close="cancel"
    >
        <NCard class="character-editor-card">
            <template #header>Черта персонажа</template>
            <CharacterFeatEditor :feat="feat" :disabled="disabled" @save="save" @cancel="cancel" />
        </NCard>
    </NModal>
</template>
