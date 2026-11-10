<script setup lang="ts">
import type { CharacterDetails } from '@/modules/character-sheet/types/character'

const props = defineProps<{ details: CharacterDetails; disabled?: boolean }>()

const emit = defineEmits<{ update: [details: CharacterDetails] }>()

function updateClass(value: unknown) {
    emit('update', {
        class: String(value ?? ''),
        level: props.details.level,
        experience: props.details.experience,
        armorClass: props.details.armorClass,
    })
}

function updateNumber(key: 'level' | 'experience' | 'armorClass', value: unknown) {
    const parsed = Number(value)
    emit('update', {
        class: props.details.class,
        level: key === 'level' ? (Number.isFinite(parsed) ? parsed : 0) : props.details.level,
        experience:
            key === 'experience'
                ? Number.isFinite(parsed)
                    ? parsed
                    : 0
                : props.details.experience,
        armorClass:
            key === 'armorClass'
                ? Number.isFinite(parsed)
                    ? parsed
                    : 0
                : props.details.armorClass,
    })
}
</script>

<template>
    <section class="sheet-section">
        <h2>Данные персонажа</h2>
        <div class="character-details-grid">
            <NFormItem label="Класс"
                ><NInput :disabled="disabled" :value="details.class" @update:value="updateClass"
            /></NFormItem>
            <NFormItem label="Уровень"
                ><NInputNumber
                    min="1"
                    step="1"
                    :disabled="disabled"
                    :value="details.level"
                    @update:value="updateNumber('level', $event)"
            /></NFormItem>
            <NFormItem label="Опыт"
                ><NInputNumber
                    min="0"
                    step="1"
                    :disabled="disabled"
                    :value="details.experience"
                    @update:value="updateNumber('experience', $event)"
            /></NFormItem>
            <NFormItem label="КД"
                ><NInputNumber
                    min="0"
                    step="1"
                    :disabled="disabled"
                    :value="details.armorClass"
                    @update:value="updateNumber('armorClass', $event)"
            /></NFormItem>
        </div>
    </section>
</template>
