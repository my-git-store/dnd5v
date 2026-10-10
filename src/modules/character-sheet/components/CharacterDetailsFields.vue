<script setup lang="ts">
import { CInput } from '@/ui/components'
import type { CharacterDetails } from '../types/character'

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
    experience: key === 'experience' ? (Number.isFinite(parsed) ? parsed : 0) : props.details.experience,
    armorClass: key === 'armorClass' ? (Number.isFinite(parsed) ? parsed : 0) : props.details.armorClass,
  })
}
</script>

<template>
  <section class="sheet-section">
    <h2>Данные персонажа</h2>
    <div class="character-details-grid">
      <CInput label="Класс" :disabled="disabled" :model-value="details.class" @update:model-value="updateClass" />
      <CInput label="Уровень" type="number" min="1" step="1" :disabled="disabled" :model-value="details.level" @update:model-value="updateNumber('level', $event)" />
      <CInput label="Опыт" type="number" min="0" step="1" :disabled="disabled" :model-value="details.experience" @update:model-value="updateNumber('experience', $event)" />
      <CInput label="КД" type="number" min="0" step="1" :disabled="disabled" :model-value="details.armorClass" @update:model-value="updateNumber('armorClass', $event)" />
    </div>
  </section>
</template>
