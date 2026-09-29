<script setup lang="ts">
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import AttackList from './AttackList.vue'
import type { Character } from '../types/character'
defineProps<{ character: Character; disabled?: boolean }>()
const emit = defineEmits<{
  'update:ability': [key: import('../types/character').AbilityKey, value: number]
  'update:skill': [id: string, value: number]
  'update:attacks': [attacks: import('../types/character').CharacterAttack[]]
}>()
function updateAbility(key: import('../types/character').AbilityKey, value: number) { emit('update:ability', key, value) }
function updateSkill(id: string, value: number) { emit('update:skill', id, value) }
</script>
<template>
  <div class="tab-content">
    <AbilityFields :abilities="character.abilities" :disabled="disabled" @update="updateAbility" />
    <SkillFields :skills="character.skills" :disabled="disabled" @update="updateSkill" />
    <AttackList :attacks="character.attacks" :disabled="disabled" @update="emit('update:attacks', $event)" />
  </div>
</template>
