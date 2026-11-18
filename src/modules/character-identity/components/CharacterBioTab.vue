<script setup lang="ts">
import { NFormItem, NInput } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'

const { character } = useCharacterSheet()
</script>

<template>
    <div v-if="character" class="flex flex-col gap-4">
        <NFormItem label="Черты характера">
            <NInput
                :value="character.personality.traits"
                type="textarea"
                rows="4"
                @update:value="character.personality.traits = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Идеалы">
            <NInput
                :value="character.personality.ideals"
                type="textarea"
                rows="4"
                @update:value="character.personality.ideals = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Привязанности">
            <NInput
                :value="character.personality.bonds"
                type="textarea"
                rows="4"
                @update:value="character.personality.bonds = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Слабости">
            <NInput
                :value="character.personality.flaws"
                type="textarea"
                rows="4"
                @update:value="character.personality.flaws = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Биография">
            <NInput
                :value="character.personality.biography"
                type="textarea"
                rows="10"
                @update:value="character.personality.biography = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Особенности и дополнительные заметки">
            <NInput
                :value="character.personality.features"
                type="textarea"
                rows="5"
                @update:value="character.personality.features = $event.trim()"
            />
        </NFormItem>
    </div>
</template>
