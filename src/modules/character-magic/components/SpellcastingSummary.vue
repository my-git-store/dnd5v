<script setup lang="ts">
import { ABILITY_FIELDS } from '@/data/characterFields'
import type { AbilityKey, CharacterAbilities } from '@/types/character'
import type { CharacterSpellcasting } from '@/types/character'

type Emits = {
    update: [spellcasting: CharacterSpellcasting]
}

const props = defineProps<{
    spellcasting: CharacterSpellcasting
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const abilityOptions = [
    { value: '', label: 'Не выбрано' },
    ...ABILITY_FIELDS.map(field => ({ value: field.key, label: field.label })),
]

function updateAbility(value: string | null) {
    emit('update', {
        ...props.spellcasting,
        spellcastingAbility: value ? (value as AbilityKey) : null,
    })
}
</script>

<template>
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Выберите характеристику</h2>
        </div>
        <NSelect
            class="w-full"
            :value="spellcasting.spellcastingAbility ?? ''"
            :options="abilityOptions"
            :disabled="disabled"
            @update:value="updateAbility"
        />
    </section>
</template>
