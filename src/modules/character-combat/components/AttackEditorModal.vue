<script setup lang="ts">
import { NCard, NModal } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import AttackEditor from './AttackEditor.vue'
import type { CharacterAttackRecord } from '@/types/character'

defineProps<{
    attack: CharacterAttackRecord
    disabled?: boolean
}>()

const emit = defineEmits<{
    close: []
}>()

const { character } = useCharacterSheet()

function save(attack: CharacterAttackRecord) {
    if (!character.value) return

    const index = character.value.attacks.findIndex(current => current.id === attack.id)
    if (index === -1) character.value.attacks.push(attack)
    else character.value.attacks[index] = attack

    emit('close')
}
</script>

<template>
    <NModal :show="true" class="w-full max-w-3xl max-h-[90vh] overflow-auto" @close="emit('close')">
        <NCard class="w-full">
            <template #header>Атака</template>
            <AttackEditor
                :attack="attack"
                :disabled="disabled"
                @save="save"
                @cancel="emit('close')"
            />
        </NCard>
    </NModal>
</template>
