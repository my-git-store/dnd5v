<script setup lang="ts">
import SpellEditor from './SpellEditor.vue'
import type { CharacterSpell } from '@/types/character'

type Props = {
    spell: CharacterSpell
    cantrip?: boolean
    disabled?: boolean
    onSave: (spell: CharacterSpell) => void
    onCancel?: () => void
}

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function save(spell: CharacterSpell) {
    props.onSave(spell)
    emit('close')
}

function cancel() {
    props.onCancel?.()
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" :on-close="cancel">
        <NCard class="w-full">
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
