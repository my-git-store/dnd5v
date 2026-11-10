<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'
import InventoryItemEditor from './InventoryItemEditor.vue'
import type { CharacterInventoryItemV3 } from '../types/characterV3'

type Props = {
    item: CharacterInventoryItemV3
    disabled?: boolean
    onSave: (item: CharacterInventoryItemV3) => void
    onCancel?: () => void
}

const props = defineProps<Props>()

const { close } = useDialog()

function save(item: CharacterInventoryItemV3) {
    props.onSave(item)
    close()
}

function cancel() {
    props.onCancel?.()
    close()
}
</script>

<template>
    <NModal :show="true" class="character-editor-modal" :on-close="cancel">
        <NCard class="character-editor-card">
            <template #header>Предмет инвентаря</template>
            <InventoryItemEditor :item="item" :disabled="disabled" @save="save" @cancel="cancel" />
        </NCard>
    </NModal>
</template>
