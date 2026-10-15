<script setup lang="ts">
import { computed } from 'vue'
import { CInput } from '@/ui/components'
import type { CharacterGender } from '../types/character'
import type { CharacterIdentityPatch, CharacterSheetView } from '../types/characterView'

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean; gender?: CharacterGender }>()
const emit = defineEmits<{ update: [patch: CharacterIdentityPatch] }>()
const selectedGender = computed(() => props.gender ?? props.character.creation?.gender ?? 'female')
const genderLocked = computed(() => Boolean(props.character.creation))

function update(key: keyof CharacterIdentityPatch, value: unknown) {
  if (key === 'gender') {
    emit('update', { gender: value === 'male' ? 'male' : 'female' })
    return
  }
  if (key === 'level' || key === 'experience') {
    const parsed = Number(value)
    emit('update', { [key]: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
    return
  }
  emit('update', { [key]: String(value ?? '') } as CharacterIdentityPatch)
}
</script>

<template>
  <div class="identity-fields">
    <p class="section-note identity-fields-note">Имя, происхождение, пол и текущий уровень героя.</p>
    <div class="identity-grid">
      <CInput label="Имя" :disabled="disabled" :model-value="character.name" @update:model-value="update('name', $event)" />
      <CInput :label="character.ruleset === '2024' ? 'Вид' : 'Раса'" :disabled="disabled" :model-value="character.race.name" @update:model-value="update('raceName', $event)" />
      <CInput label="Класс" :disabled="disabled" :model-value="character.class" @update:model-value="update('className', $event)" />
      <CInput label="Подкласс" :disabled="disabled" :model-value="character.subclass" @update:model-value="update('subclass', $event)" />
      <CInput label="Предыстория" :disabled="disabled" :model-value="character.background.name" @update:model-value="update('backgroundName', $event)" />
      <CInput label="Мировоззрение" :disabled="disabled" :model-value="character.alignment" @update:model-value="update('alignment', $event)" />
      <CInput label="Уровень" type="number" min="1" max="20" step="1" :disabled="disabled" :model-value="character.level" @update:model-value="update('level', $event)" />
      <CInput label="Опыт" type="number" min="0" step="1" :disabled="disabled" :model-value="character.experience" @update:model-value="update('experience', $event)" />
      <fieldset class="gender-choice identity-gender">
        <legend>Пол персонажа</legend>
        <div class="gender-choice-options" role="radiogroup" aria-label="Пол персонажа">
          <button type="button" class="gender-choice-button" :class="{ selected: selectedGender === 'female' }" :aria-pressed="selectedGender === 'female'" :disabled="disabled || genderLocked" :title="genderLocked ? 'Пол фиксируется после создания персонажа.' : undefined" @click="update('gender', 'female')">Женский</button>
          <button type="button" class="gender-choice-button" :class="{ selected: selectedGender === 'male' }" :aria-pressed="selectedGender === 'male'" :disabled="disabled || genderLocked" :title="genderLocked ? 'Пол фиксируется после создания персонажа.' : undefined" @click="update('gender', 'male')">Мужской</button>
        </div>
      </fieldset>
    </div>
  </div>
</template>
