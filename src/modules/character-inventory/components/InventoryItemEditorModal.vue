<script setup lang="ts">
import InventoryItemEditor from './InventoryItemEditor.vue'
import type { CharacterInventoryItemRecord } from '@/types/character'

type Props = {
    item: CharacterInventoryItemRecord
    disabled?: boolean
    onSave: (item: CharacterInventoryItemRecord) => void
    onCancel?: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

function save(item: CharacterInventoryItemRecord) {
    props.onSave(item)
    emit('close')
}

function cancel() {
    props.onCancel?.()
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="c-character-editor-modal" :on-close="cancel">
        <NCard class="c-character-editor-card">
            <template #header>Предмет инвентаря</template>
            <InventoryItemEditor :item="item" :disabled="disabled" @save="save" @cancel="cancel" />
        </NCard>
    </NModal>
</template>
