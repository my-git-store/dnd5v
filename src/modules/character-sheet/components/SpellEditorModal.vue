<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'
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
    <NModal :show="true" class="character-editor-modal" :on-close="cancel">
        <NCard class="character-editor-card">
            <template #header>{{ cantrip ? 'Заговор' : 'Заклинание' }}</template>
            <SpellEditor
                :spell="spell"
                :cantrip="cantrip"
                :disabled="disabled"
                @save="save"
                @cancel="cancel"
            />
        </NCard>
    </NModal>
</template>
