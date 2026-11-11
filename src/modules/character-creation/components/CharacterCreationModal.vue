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

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function backToSheet() {
    props.onBackToSheet()
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="character-creation-modal" :on-close="() => emit('close')">
        <div class="character-creation-modal-content c-character-sheet">
            <CharacterCreationTab
                :character="character"
                :disabled="disabled"
                @create="onCreate"
                @back-to-sheet="backToSheet"
            />
        </div>
    </NModal>
</template>

<style scoped>
.character-creation-modal {
    width: min(1180px, calc(100vw - 24px));
    max-width: none;
    max-height: calc(100vh - 24px);
    overflow: auto;
}
.character-creation-modal-content.c-character-sheet {
    width: 100%;
    max-width: none;
    min-height: 0;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
}
.character-creation-modal-content.c-character-sheet::before,
.character-creation-modal-content.c-character-sheet::after {
    display: none;
}
</style>
