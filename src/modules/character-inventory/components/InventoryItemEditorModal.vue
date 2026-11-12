<script setup lang="ts">
import InventoryItemEditor from './InventoryItemEditor.vue'
import type { CharacterInventoryItemRecord } from '@/types/character'

type Props = {
    item: CharacterInventoryItemRecord
    disabled?: boolean
    onSave: (item: CharacterInventoryItemRecord) => void
    onCancel?: () => void
}

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

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
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" :on-close="cancel">
        <NCard class="w-full">
            <template #header>Предмет инвентаря</template>
            <InventoryItemEditor :item="item" :disabled="disabled" @save="save" @cancel="cancel" />
        </NCard>
    </NModal>
</template>
