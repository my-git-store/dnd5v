<script setup lang="ts">
import { CBtn, CCard, CModal, useDialog } from '@/ui/components'
import IdentityFields from './IdentityFields.vue'
import type { CharacterIdentityPatch, CharacterSheetView } from '../types/characterView'

type Props = {
  character: CharacterSheetView
  disabled?: boolean
  onUpdate: (patch: CharacterIdentityPatch) => void
  onCancel?: () => void
}

const props = defineProps<Props>()
const { close } = useDialog()

function update(patch: CharacterIdentityPatch) {
  props.onUpdate(patch)
}

function cancel() {
  props.onCancel?.()
  close()
}
</script>

<template>
  <CModal class="character-identity-modal" @close="cancel">
    <CCard class="character-editor-card character-identity-modal-card">
      <IdentityFields :character="character" :disabled="disabled" @update="update" />
      <div class="character-identity-modal-actions">
        <CBtn color-type="primary" @click="cancel">Готово</CBtn>
      </div>
    </CCard>
  </CModal>
</template>
