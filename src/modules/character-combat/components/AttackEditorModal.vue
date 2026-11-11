<script setup lang="ts">
import AttackEditor from './AttackEditor.vue'
import type { CharacterAbilities } from '@/types/character'
import type { CharacterAttackView } from '@/types/characterView'

type Props = {
    attack: CharacterAttackView
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
    onSave: (attack: CharacterAttackView) => void
    onCancel?: () => void
}

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function save(attack: CharacterAttackView) {
    props.onSave(attack)
    emit('close')
}

function cancel() {
    props.onCancel?.()
    emit('close')
}
</script>

<template>
    <NModal :show="true" class="c-character-editor-modal" :on-close="cancel">
        <NCard class="c-character-editor-card">
            <template #header>Атака</template>
            <AttackEditor
                :attack="attack"
                :abilities="abilities"
                :level="level"
                :disabled="disabled"
                @save="save"
                @cancel="cancel"
            />
        </NCard>
    </NModal>
</template>
