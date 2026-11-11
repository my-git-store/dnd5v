<script setup lang="ts">
import { ref } from 'vue'
import IdentityFields from './IdentityFields.vue'
import {
    cloneCharacterView,
    type CharacterIdentityPatch,
    type CharacterSheetView,
} from '@/types/characterView'
import type { CharacterGender } from '@/types/character'

export type Props = {
    character: CharacterSheetView
    disabled?: boolean
    onUpdate: (patch: CharacterIdentityPatch) => void
    onCancel?: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

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
    emit('close')
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
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-[600px]!" :on-close="cancel">
        <NCard class="c-character-editor-card">
            <template #header>Основные сведения</template>
            <IdentityFields :character="draft" :gender="draftGender" :disabled="disabled" @update="update" />
            <div class="w-full justify-end flex gap-4">
                <NButton :disabled="disabled" @click="cancel">Отмена</NButton>
                <NButton type="primary" :disabled="disabled" @click="save">Сохранить</NButton>
            </div>
        </NCard>
    </NModal>
</template>

<!-- <style scoped>
.character-identity-modal {
    max-width: none;
    overflow: auto;
}
.character-identity-modal-card,
.character-identity-modal-card :deep(.identity-fields),
.character-identity-modal-card :deep(.identity-grid),
.character-identity-modal-card :deep(.identity-grid > .flex-col),
.character-identity-modal-card :deep(.n-input-wrapper),
.character-identity-modal-card :deep(.n-input) {
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
}
.character-identity-modal-card :deep(.identity-grid),
.character-identity-modal-card :deep(.identity-grid > .flex-col),
.character-identity-modal-card :deep(.n-input) {
    width: 100%;
}
.character-identity-modal-card :deep(.identity-fields-note) {
    margin: 0 0 16px;
}
.character-identity-modal-card :deep(.identity-gender) {
    grid-column: 1 / -1;
}
</style> -->
