<script setup lang="ts">
import { NCard, NModal } from 'naive-ui'

import CharacterFeatEditor from './CharacterFeatEditor.vue'
import type { CharacterFeat } from '@/types/character'

type Emits = {
    close: []
}

export interface Props {
    feat: CharacterFeat
    disabled?: boolean
    onSave: (feat: CharacterFeat) => void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function save(feat: CharacterFeat) {
    props.onSave(feat)
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" @close="emit('close')">
        <NCard class="w-full">
            <template #header>Черта персонажа</template>
            <CharacterFeatEditor :feat="feat" :disabled="disabled" @save="save" @cancel="emit('close')" />
        </NCard>
    </NModal>
</template>
