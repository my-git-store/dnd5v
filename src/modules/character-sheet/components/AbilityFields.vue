<script setup lang="ts">
import { CInput } from '@/ui/components'
import { ABILITY_FIELDS } from '../data/characterFields'
import type { AbilityKey, CharacterAbilities } from '../types/character'
defineProps<{ abilities: CharacterAbilities; disabled?: boolean }>()
const emit = defineEmits<{ update: [key: AbilityKey, value: number] }>()
function onInput(key: AbilityKey, value: unknown) { const numberValue = Number(value); emit('update', key, Number.isFinite(numberValue) ? numberValue : 0) }
</script>
<template>
  <section class="sheet-section"><h2>Характеристики</h2><div class="ability-grid">
    <div v-for="field in ABILITY_FIELDS" :key="field.key" class="field-card"><CInput type="number" :label="field.label" :disabled="disabled" :model-value="abilities[field.key]" @update:model-value="onInput(field.key, $event)" /></div>
  </div></section>
</template>
