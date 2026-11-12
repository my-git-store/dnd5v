<script setup lang="ts">
import CharacterFeatEditor from './CharacterFeatEditor.vue'
import type { CharacterFeat } from '@/types/character'

type Emits = {
    close: []
}

const props = defineProps<{
    feat: CharacterFeat
    disabled?: boolean
    onSave: (feat: CharacterFeat) => void
}>()

const emit = defineEmits<Emits>()

function save(feat: CharacterFeat) {
    props.onSave(feat)
    emit('close')
}
function cancel() {
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" :on-close="cancel">
        <NCard class="w-full">
            <template #header>Черта персонажа</template>
            <CharacterFeatEditor :feat="feat" :disabled="disabled" @save="save" @cancel="cancel" />
        </NCard>
    </NModal>
</template>
