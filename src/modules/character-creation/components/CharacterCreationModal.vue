<script setup lang="ts">
import CharacterCreationTab from './CharacterCreationTab.vue'
import type { CharacterCreationPayload } from '@/domain/characterCreation'
import type { CharacterSheetView } from '@/types/characterView'

type Props = {
    character: CharacterSheetView
    disabled?: boolean
    onCreate: (payload: CharacterCreationPayload) => void
    onBackToSheet: () => void
}

const props = defineProps<Props>()

const emit = defineEmits<{ close: [] }>()

function backToSheet() {
    props.onBackToSheet()
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="character-creation-modal" :on-close="() => emit('close')">
        <div class="character-creation-modal-content character-sheet">
            <CharacterCreationTab
                :character="character"
                :disabled="disabled"
                @create="onCreate"
                @back-to-sheet="backToSheet"
            />
        </div>
    </NModal>
</template>
