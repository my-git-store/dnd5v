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
    <NModal
        :show="true"
        class="w-full max-w-6xl max-h-[90vh] overflow-auto"
        :on-close="() => emit('close')"
    >
        <div class="p-6">
            <CharacterCreationTab
                :character="character"
                :disabled="disabled"
                @create="onCreate"
                @back-to-sheet="backToSheet"
            />
        </div>
    </NModal>
</template>
