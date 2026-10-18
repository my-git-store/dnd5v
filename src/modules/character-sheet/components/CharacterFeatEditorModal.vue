<script setup lang="ts">
import { CCard, CModal, useDialog } from '@/ui/components'
import CharacterFeatEditor from './CharacterFeatEditor.vue'
import type { CharacterFeatV3 } from '../types/characterV3'

const props = defineProps<{ feat: CharacterFeatV3; disabled?: boolean; onSave: (feat: CharacterFeatV3) => void }>()
const { close } = useDialog()
function save(feat: CharacterFeatV3) { props.onSave(feat); close() }
function cancel() { close() }
</script>

<template>
  <CModal class="character-editor-modal" @close="cancel">
    <CCard class="character-editor-card">
      <template #title>Черта персонажа</template>
      <CharacterFeatEditor :feat="feat" :disabled="disabled" @save="save" @cancel="cancel" />
    </CCard>
  </CModal>
</template>
