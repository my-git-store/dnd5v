<script setup lang="ts">
import { NCard, NModal } from 'naive-ui'

import AttackEditor from './AttackEditor.vue'
import type { CharacterAttackRecord } from '@/types/character'

type Props = {
    attack: CharacterAttackRecord
    disabled?: boolean
    onSave: (attack: CharacterAttackRecord) => void
    onCancel?: () => void
}

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function save(attack: CharacterAttackRecord) {
    props.onSave(attack)
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
            <template #header>Атака</template>
            <AttackEditor
                :attack="attack"
                :disabled="disabled"
                @save="save"
                @cancel="cancel"
            />
        </NCard>
    </NModal>
</template>
