<script setup lang="ts">
import { CTextarea } from '@/ui/components'
import type { CharacterBio } from '../types/character'
defineProps<{ bio: CharacterBio; disabled?: boolean }>()
const emit = defineEmits<{ update: [bio: CharacterBio] }>()
</script>
<template><div class="tab-content"><section class="sheet-section"><h2>Биография</h2><CTextarea :model-value="bio.biography" label="Биография" rows="7" :disabled="disabled" @update:model-value="emit('update', { ...bio, biography: String($event) })" /><CTextarea :model-value="bio.traits" label="Черты характера" rows="4" :disabled="disabled" @update:model-value="emit('update', { ...bio, traits: String($event) })" /><CTextarea :model-value="bio.features" label="Особенности персонажа" rows="4" :disabled="disabled" @update:model-value="emit('update', { ...bio, features: String($event) })" /></section></div></template>
