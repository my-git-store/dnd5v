<script setup lang="ts">
import { useDialog } from '@/modules/character-sheet/composables/useDialog'
import InventoryItemEditor from './InventoryItemEditor.vue'
import type { CharacterInventoryItemRecord } from '@/modules/character-sheet/types/character'

type Props = {
    item: CharacterInventoryItemRecord
    disabled?: boolean
    onSave: (item: CharacterInventoryItemRecord) => void
    onCancel?: () => void
}

const props = defineProps<Props>()

const { close } = useDialog()

function save(item: CharacterInventoryItemRecord) {
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
