<script setup lang="ts">
import { NFormItem, NInput } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'

const { character } = useCharacterSheet()
</script>

<template>
    <div v-if="character" class="grid gap-4">
        <section class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NFormItem label="Черты характера"
                ><NInput
                    v-model:value="character.personality.traits"
                    type="textarea"
                    rows="4"
            /></NFormItem>
            <NFormItem label="Идеалы"
                ><NInput
                    v-model:value="character.personality.ideals"
                    type="textarea"
                    rows="4"
            /></NFormItem>
            <NFormItem label="Привязанности"
                ><NInput
                    v-model:value="character.personality.bonds"
                    type="textarea"
                    rows="4"
            /></NFormItem>
            <NFormItem label="Слабости"
                ><NInput
                    v-model:value="character.personality.flaws"
                    type="textarea"
                    rows="4"
            /></NFormItem>
            <NFormItem label="Биография"
                ><NInput
                    v-model:value="character.personality.biography"
                    type="textarea"
                    rows="10"
            /></NFormItem>
            <NFormItem label="Особенности и дополнительные заметки"
                ><NInput
                    v-model:value="character.personality.features"
                    type="textarea"
                    rows="5"
            /></NFormItem>
        </section>
    </div>
</template>
