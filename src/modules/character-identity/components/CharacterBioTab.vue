<script setup lang="ts">
import type { CharacterPersonality } from '@/types/character'

type Emits = {
    update: [personality: CharacterPersonality]
}

const props = defineProps<{ personality: CharacterPersonality; disabled?: boolean }>()

const emit = defineEmits<Emits>()

function update(key: keyof CharacterPersonality, value: unknown) {
    emit('update', { ...props.personality, [key]: String(value ?? '') })
}
</script>

<template>
    <div class="c-tab-content bio-tab">
        <section class="bio-grid">
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
                    class="bio-wide bio-biography-field"
                    rows="10"
                    :value="personality.biography"
                    :disabled="disabled"
                    @update:value="update('biography', $event)"
            /></NFormItem>
            <NFormItem label="Особенности и дополнительные заметки"
                ><NInput
                    type="textarea"
                    class="bio-wide"
                    rows="5"
                    :value="personality.features"
                    :disabled="disabled"
                    @update:value="update('features', $event)"
            /></NFormItem>
        </section>
    </div>
</template>

<style scoped>
.bio-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}
.bio-wide {
    grid-column: 1 / -1;
}
.bio-biography-field :deep(.n-input-textarea) {
    min-height: 240px;
    resize: vertical;
}
</style>
