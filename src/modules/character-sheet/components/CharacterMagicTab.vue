<script setup lang="ts">
import SpellList from './SpellList.vue'
import type { Character, CharacterSpell } from '../types/character'
defineProps<{ character: Character; disabled?: boolean }>()
const emit = defineEmits<{ 'update:spells': [spells: CharacterSpell[]]; 'update:cantrips': [spells: CharacterSpell[]] }>()
</script>
<template><div class="tab-content"><SpellList title="Заговоры" :spells="character.cantrips" cantrip :disabled="disabled" @update="emit('update:cantrips', $event)" /><SpellList title="Заклинания" :spells="character.spells" :disabled="disabled" @update="emit('update:spells', $event)" /></div></template>
