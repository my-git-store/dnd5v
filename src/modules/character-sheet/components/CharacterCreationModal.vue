<script setup lang="ts">
import { CModal, useDialog } from '@/ui/components'
import CharacterCreationTab from './CharacterCreationTab.vue'
import type { CharacterCreationPayload } from '../domain/characterCreation'
import type { CharacterSheetView } from '../types/characterView'

type Props = {
  character: CharacterSheetView
  disabled?: boolean
  onCreate: (payload: CharacterCreationPayload) => void
  onBackToSheet: () => void
}

const props = defineProps<Props>()
const { close } = useDialog()

function backToSheet() {
  props.onBackToSheet()
  close()
}
</script>

<template>
  <CModal class="character-creation-modal" @close="close">
    <div class="character-creation-modal-content character-sheet">
      <CharacterCreationTab :character="character" :disabled="disabled" @create="onCreate" @back-to-sheet="backToSheet" />
    </div>
  </CModal>
</template>
