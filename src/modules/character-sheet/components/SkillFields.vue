<script setup lang="ts">
import { CInput } from '@/ui/components'
import type { CharacterSkill } from '../types/character'
defineProps<{ skills: CharacterSkill[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [id: string, value: number] }>()
function onInput(id: string, value: unknown) { const numberValue = Number(value); emit('update', id, Number.isFinite(numberValue) ? numberValue : 0) }
</script>
<template>
  <section class="sheet-section"><h2>Навыки</h2><div class="skills-grid">
    <div v-for="skill in skills" :key="skill.id" class="skill-row"><span>{{ skill.name }}</span><CInput type="number" :aria-label="skill.name" :disabled="disabled" :model-value="skill.value" @update:model-value="onInput(skill.id, $event)" /></div>
  </div></section>
</template>
