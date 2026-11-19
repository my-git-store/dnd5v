<script setup lang="ts">
import { useCharacterSheet } from '@/composables/useCharacterSheet'

import IdentityFields from './IdentityFields.vue'

const { character } = useCharacterSheet()
</script>

<template>
    <header v-if="character" class="flex flex-wrap items-center justify-between gap-4">
        <IdentityFields />
    </header>
</template>
