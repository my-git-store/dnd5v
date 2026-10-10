<script setup lang="ts">
import { CInput } from '@/ui/components'
import { ABILITY_FIELDS } from '../data/characterFields'
import { calculateSavingThrowBonus } from '../domain/savingThrow'
import { signedModifier } from '../domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '../types/character'
import type { CharacterSavingThrowsV3 } from '../types/characterV3'

const props = defineProps<{ abilities: CharacterAbilities; savingThrows: CharacterSavingThrowsV3; level: number; disabled?: boolean }>()
const emit = defineEmits<{ update: [key: AbilityKey, patch: { proficient?: boolean; additionalBonus?: number }] }>()

function updateBonus(key: AbilityKey, value: unknown) {
  const parsed = Number(value)
  emit('update', key, { additionalBonus: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
}

function updateProficiency(key: AbilityKey, event: Event) {
  emit('update', key, { proficient: (event.target as HTMLInputElement).checked })
}

function result(key: AbilityKey) {
  const entry = props.savingThrows[key]
  return calculateSavingThrowBonus({ ability: key, proficient: entry.proficient, additionalBonus: entry.additionalBonus }, props.abilities, props.level)
}
</script>

<template>
  <section class="sheet-section saving-throws-panel">
    <div class="section-heading section-heading-stack">
      <div>
        <h2>Спасброски</h2>
        <p class="section-note">Итог складывается из модификатора характеристики, владения и добавки.</p>
      </div>
    </div>
    <div class="saving-throws-grid">
      <div v-for="field in ABILITY_FIELDS" :key="field.key" class="saving-throw-row">
        <div><strong>{{ field.label }}</strong><span class="field-caption">Модификатор + владение + добавка</span></div>
        <label class="check-control"><input type="checkbox" :checked="savingThrows[field.key].proficient" :disabled="disabled" :aria-label="`${field.label}: владение`" @change="updateProficiency(field.key, $event)"><span>Владение</span></label>
        <CInput type="number" step="1" label="Добавка" :disabled="disabled" :model-value="savingThrows[field.key].additionalBonus" @update:model-value="updateBonus(field.key, $event)" />
        <div class="saving-result"><span class="saving-result-label">Итог</span><strong class="derived-value">{{ result(field.key) === null ? '—' : signedModifier(result(field.key)!) }}</strong></div>
      </div>
    </div>
  </section>
</template>
