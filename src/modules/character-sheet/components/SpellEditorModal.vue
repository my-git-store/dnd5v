<script setup lang="ts">
import { CCard, CModal, useDialog } from '@/ui/components'
import SpellEditor from './SpellEditor.vue'
import type { CharacterSpell } from '../types/character'

type Props = {
  spell: CharacterSpell
  cantrip?: boolean
  disabled?: boolean
  onSave: (spell: CharacterSpell) => void
  onCancel?: () => void
}

const props = defineProps<Props>()
const { close } = useDialog()

function save(spell: CharacterSpell) {
  props.onSave(spell)
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
      <template #title>{{ cantrip ? 'Заговор' : 'Заклинание' }}</template>
      <SpellEditor :spell="spell" :cantrip="cantrip" :disabled="disabled" @save="save" @cancel="cancel" />
    </CCard>
  </CModal>
</template>
