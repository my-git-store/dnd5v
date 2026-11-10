<script setup lang="ts">
import { ABILITY_FIELDS } from "../data/characterFields";
import { abilityModifier, signedModifier } from "../domain/abilityModifier";
import type { AbilityKey, CharacterAbilities } from "../types/character";
defineProps<{ abilities: CharacterAbilities; disabled?: boolean }>();
const emit = defineEmits<{ update: [key: AbilityKey, value: number] }>();

function onInput(key: AbilityKey, value: unknown) {
  const numberValue = Number(value);
  emit("update", key, Number.isFinite(numberValue) ? numberValue : 0);
}
</script>
<template>
  <section class="sheet-section ability-panel">
    <div class="section-heading section-heading-stack">
      <div>
        <h2>Характеристики</h2>
        <p class="section-note">Введите исходные значения. Модификатор справа рассчитывается автоматически.</p>
      </div>
    </div>
    <div class="ability-grid">
      <div v-for="field in ABILITY_FIELDS" :key="field.key" class="field-card">
        <NFormItem :label="field.label">
          <NInputNumber :disabled="disabled" :value="abilities[field.key]" @update:value="onInput(field.key, $event)" />
        </NFormItem>
        <p class="modifier-caption" :title="'Модификатор = ⌊(значение − 10) / 2⌋'">
          Модификатор (расчёт):
          {{ signedModifier(abilityModifier(abilities[field.key])) }}
        </p>
      </div>
    </div>
  </section>
</template>
