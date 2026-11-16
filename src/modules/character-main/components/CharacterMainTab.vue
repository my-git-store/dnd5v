<script setup lang="ts">
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import CharacterFeatList from '@/modules/character-feats/components/CharacterFeatList.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'

const { character } = useCharacterSheet()
</script>

<template>
    <div v-if="character" class="grid gap-4">
        <AbilityFields />
        <SkillFields />
        <CharacterFeatList />
    </div>
</template>
