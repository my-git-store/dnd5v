<script setup lang="ts">
import { ref } from 'vue'
import { CBtn, CCard, CModal, useDialog } from '@/ui/components'
import IdentityFields from './IdentityFields.vue'
import { cloneCharacterView, type CharacterIdentityPatch, type CharacterSheetView } from '../types/characterView'
import type { CharacterGender } from '../types/character'

type Props = {
  character: CharacterSheetView
  disabled?: boolean
  onUpdate: (patch: CharacterIdentityPatch) => void
  onCancel?: () => void
}

const props = defineProps<Props>()
const { close } = useDialog()
const draft = ref(cloneCharacterView(props.character))
const draftGender = ref<CharacterGender>(props.character.creation?.gender ?? 'female')

function update(patch: CharacterIdentityPatch) {
  if (patch.name !== undefined) draft.value.name = patch.name
  if (patch.raceName !== undefined) draft.value.race.name = patch.raceName
  if (patch.className !== undefined) draft.value.class = patch.className
  if (patch.subclass !== undefined) draft.value.subclass = patch.subclass
  if (patch.backgroundName !== undefined) draft.value.background.name = patch.backgroundName
  if (patch.alignment !== undefined) draft.value.alignment = patch.alignment
  if (patch.level !== undefined) draft.value.level = patch.level
  if (patch.experience !== undefined) draft.value.experience = patch.experience
  if (patch.gender !== undefined) draftGender.value = patch.gender
}

function cancel() {
  props.onCancel?.()
  close()
}

function save() {
  props.onUpdate({
    name: draft.value.name,
    raceName: draft.value.race.name,
    className: draft.value.class,
    subclass: draft.value.subclass,
    backgroundName: draft.value.background.name,
    alignment: draft.value.alignment,
    level: draft.value.level,
    experience: draft.value.experience,
    gender: draftGender.value,
  })
  close()
}
</script>

<template>
  <CModal class="character-identity-modal" @close="cancel">
    <CCard class="character-editor-card character-identity-modal-card">
      <template #title>Основные сведения</template>
      <IdentityFields :character="draft" :gender="draftGender" :disabled="disabled" @update="update" />
      <div class="character-identity-modal-actions">
        <CBtn :disabled="disabled" @click="cancel">Отмена</CBtn>
        <CBtn color-type="primary" :disabled="disabled" @click="save">Сохранить</CBtn>
      </div>
    </CCard>
  </CModal>
</template>
