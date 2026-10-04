<script setup lang="ts">
import { CInput } from '@/ui/components'
import type { CharacterIdentityPatch, CharacterSheetView } from '../types/characterView'

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{ update: [patch: CharacterIdentityPatch] }>()

function update(key: keyof CharacterIdentityPatch, value: unknown) {
  if (key === 'level' || key === 'experience') {
    const parsed = Number(value)
    emit('update', { [key]: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
    return
  }
  emit('update', { [key]: String(value ?? '') } as CharacterIdentityPatch)
}
</script>

<template>
  <section class="sheet-section">
    <div class="section-heading section-heading-stack">
      <div>
        <h2>Основные сведения</h2>
        <p class="section-note">Имя, происхождение и текущий уровень героя.</p>
      </div>
    </div>
    <div class="identity-grid">
      <CInput label="Имя" :disabled="disabled" :model-value="character.name" @update:model-value="update('name', $event)" />
      <CInput :label="character.ruleset === '2024' ? 'Вид' : 'Раса'" :disabled="disabled" :model-value="character.race.name" @update:model-value="update('raceName', $event)" />
      <CInput label="Класс" :disabled="disabled" :model-value="character.class" @update:model-value="update('className', $event)" />
      <CInput label="Подкласс" :disabled="disabled" :model-value="character.subclass" @update:model-value="update('subclass', $event)" />
      <CInput label="Предыстория" :disabled="disabled" :model-value="character.background.name" @update:model-value="update('backgroundName', $event)" />
      <CInput label="Мировоззрение" :disabled="disabled" :model-value="character.alignment" @update:model-value="update('alignment', $event)" />
      <CInput label="Уровень" type="number" min="1" max="20" step="1" :disabled="disabled" :model-value="character.level" @update:model-value="update('level', $event)" />
      <CInput label="Опыт" type="number" min="0" step="1" :disabled="disabled" :model-value="character.experience" @update:model-value="update('experience', $event)" />
    </div>
  </section>
</template>
