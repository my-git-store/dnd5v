<script setup lang="ts">
import { CCard, CModal, useDialog } from '@/ui/components'
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
  <CModal class="character-editor-modal" @close="cancel">
    <CCard class="character-editor-card">
      <template #title>Предмет инвентаря</template>
      <InventoryItemEditor :item="item" :disabled="disabled" @save="save" @cancel="cancel" />
    </CCard>
  </CModal>
</template>
