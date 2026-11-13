<script setup lang="ts">
import { NFormItem, NInput } from 'naive-ui'

import { useCharacterIdentity } from '../composables/useCharacterIdentity'
import type { CharacterPersonality } from '@/types/character'

const props = defineProps<{ personality: CharacterPersonality; disabled?: boolean }>()

const { updatePersonality } = useCharacterIdentity()

function update(key: keyof CharacterPersonality, value: unknown) {
    updatePersonality({ ...props.personality, [key]: String(value ?? '') })
}
</script>

<template>
    <div class="grid gap-4">
        <section class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NFormItem label="Черты характера"
                ><NInput
                    type="textarea"
                    rows="4"
                    :value="personality.traits"
                    :disabled="disabled"
                    @update:value="update('traits', $event)"
            /></NFormItem>
            <NFormItem label="Идеалы"
                ><NInput
                    type="textarea"
                    rows="4"
                    :value="personality.ideals"
                    :disabled="disabled"
                    @update:value="update('ideals', $event)"
            /></NFormItem>
            <NFormItem label="Привязанности"
                ><NInput
                    type="textarea"
                    rows="4"
                    :value="personality.bonds"
                    :disabled="disabled"
                    @update:value="update('bonds', $event)"
            /></NFormItem>
            <NFormItem label="Слабости"
                ><NInput
                    type="textarea"
                    rows="4"
                    :value="personality.flaws"
                    :disabled="disabled"
                    @update:value="update('flaws', $event)"
            /></NFormItem>
            <NFormItem label="Биография"
                ><NInput
                    type="textarea"
                    rows="10"
                    :value="personality.biography"
                    :disabled="disabled"
                    @update:value="update('biography', $event)"
            /></NFormItem>
            <NFormItem label="Особенности и дополнительные заметки"
                ><NInput
                    type="textarea"
                    rows="5"
                    :value="personality.features"
                    :disabled="disabled"
                    @update:value="update('features', $event)"
            /></NFormItem>
        </section>
    </div>
</template>
