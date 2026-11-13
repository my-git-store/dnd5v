<script setup lang="ts">
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

defineProps<{
    model: Readonly<Pick<CharacterCreationModel, 'selected2024Species' | 'speciesChoices'>>
}>()
</script>

<template>
    <div class="grid gap-4">
        <h3>{{ model.selected2024Species.name }}</h3>
        <p>{{ model.selected2024Species.description }}</p>
        <ul>
            <li v-for="trait in model.selected2024Species.traits" :key="trait">{{ trait }}</li>
        </ul>
        <p v-for="choice in model.selected2024Species.choices" :key="choice.id">
            {{ choice.label }}: {{ model.speciesChoices[choice.id]?.join(', ') || 'Не выбрано' }}
        </p>
    </div>
</template>
