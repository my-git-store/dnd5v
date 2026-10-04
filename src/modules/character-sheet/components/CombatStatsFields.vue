<script setup lang="ts">
import { computed } from 'vue'
import { CInput } from '@/ui/components'
import { abilityModifier, signedModifier } from '../domain/abilityModifier'
import type { CharacterAbilities } from '../types/character'
import type { CharacterCombatV3 } from '../types/characterV3'

const props = defineProps<{ combat: CharacterCombatV3; abilities: CharacterAbilities; disabled?: boolean }>()
const emit = defineEmits<{ update: [combat: CharacterCombatV3] }>()

const armorClass = computed(() => {
  return props.combat.armorClass.value
})
const initiative = computed(() => abilityModifier(props.abilities.dexterity) + props.combat.initiative.additionalBonus)
const speed = computed(() => props.combat.speed.override ?? props.combat.speed.base)

function numberValue(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
function nullableNumber(value: unknown): number | null {
  return value === '' || value === null || value === undefined ? null : numberValue(value)
}
function copy(): CharacterCombatV3 { return JSON.parse(JSON.stringify(props.combat)) as CharacterCombatV3 }
function updateArmorValue(value: unknown) {
  const next = copy()
  const parsed = numberValue(value)
  // Keep the v3 envelope intact while making a direct edit authoritative.
  // Existing computed values are shown first, then switch to manual on edit.
  next.armorClass.mode = 'manual'
  next.armorClass.value = parsed
  emit('update', next)
}
function updateInitiative(value: unknown) { const next = copy(); next.initiative.additionalBonus = numberValue(value); emit('update', next) }
function updateSpeed(key: keyof CharacterCombatV3['speed'], value: unknown) {
  const next = copy()
  if (key === 'base') next.speed.base = numberValue(value)
  else next.speed[key] = nullableNumber(value)
  emit('update', next)
}
function updateHitPoints(key: keyof CharacterCombatV3['hitPoints'], value: unknown) {
  const next = copy(); next.hitPoints[key] = numberValue(value); emit('update', next)
}
function updateHitDice(key: keyof CharacterCombatV3['hitDice'], value: unknown) {
  const next = copy()
  if (key === 'size') next.hitDice.size = String(value ?? '')
  else next.hitDice[key] = numberValue(value)
  emit('update', next)
}
function updateDeathSave(key: keyof CharacterCombatV3['deathSaves'], value: unknown) {
  const next = copy(); next.deathSaves[key] = numberValue(value); emit('update', next)
}
</script>

<template>
  <section class="sheet-section">
    <h2>Бой</h2>
    <div class="combat-grid">
      <div class="field-card combat-armor">
        <h3>Класс доспеха</h3>
        <p class="derived-value combat-result">{{ armorClass }}</p>
        <p class="field-caption">Расчёт КД не настроен — укажите итоговое значение вручную.</p>
        <CInput type="number" min="0" step="1" label="КД" :model-value="armorClass" :disabled="disabled" @update:model-value="updateArmorValue" />
      </div>
      <div class="field-card">
        <h3>Инициатива</h3><p class="derived-value combat-result">{{ signedModifier(initiative) }}</p>
        <p class="field-caption">Модификатор Ловкости + добавка</p>
        <CInput type="number" step="1" label="Доп. бонус инициативы" :model-value="combat.initiative.additionalBonus" :disabled="disabled" @update:model-value="updateInitiative" />
      </div>
      <div class="field-card">
        <h3>Скорость</h3><p class="derived-value combat-result">{{ speed }}</p>
        <div class="combat-subgrid">
          <CInput type="number" min="0" label="Базовая" :model-value="combat.speed.base" :disabled="disabled" @update:model-value="updateSpeed('base', $event)" />
          <CInput type="number" min="0" label="Переопределение" :model-value="combat.speed.override ?? ''" :disabled="disabled" @update:model-value="updateSpeed('override', $event)" />
          <CInput type="number" min="0" label="Полёт" :model-value="combat.speed.fly ?? ''" :disabled="disabled" @update:model-value="updateSpeed('fly', $event)" />
          <CInput type="number" min="0" label="Плавание" :model-value="combat.speed.swim ?? ''" :disabled="disabled" @update:model-value="updateSpeed('swim', $event)" />
        </div>
      </div>
      <div class="field-card">
        <h3>Хиты</h3>
        <div class="combat-subgrid">
          <CInput type="number" min="0" step="1" label="Максимум" :model-value="combat.hitPoints.max" :disabled="disabled" @update:model-value="updateHitPoints('max', $event)" />
          <CInput type="number" min="0" step="1" label="Текущие" :model-value="combat.hitPoints.current" :disabled="disabled" @update:model-value="updateHitPoints('current', $event)" />
          <CInput type="number" min="0" step="1" label="Временные" :model-value="combat.hitPoints.temporary" :disabled="disabled" @update:model-value="updateHitPoints('temporary', $event)" />
        </div>
      </div>
      <div class="field-card">
        <h3>Кости хитов</h3>
        <div class="combat-subgrid">
          <CInput label="Размер (например, d8)" :model-value="combat.hitDice.size" :disabled="disabled" @update:model-value="updateHitDice('size', $event)" />
          <CInput type="number" min="0" step="1" label="Всего" :model-value="combat.hitDice.total" :disabled="disabled" @update:model-value="updateHitDice('total', $event)" />
          <CInput type="number" min="0" step="1" label="Потрачено" :model-value="combat.hitDice.spent" :disabled="disabled" @update:model-value="updateHitDice('spent', $event)" />
        </div>
      </div>
      <div class="field-card">
        <h3>Спасброски от смерти</h3>
        <div class="combat-subgrid">
          <CInput type="number" min="0" max="3" step="1" label="Успехи" :model-value="combat.deathSaves.successes" :disabled="disabled" @update:model-value="updateDeathSave('successes', $event)" />
          <CInput type="number" min="0" max="3" step="1" label="Провалы" :model-value="combat.deathSaves.failures" :disabled="disabled" @update:model-value="updateDeathSave('failures', $event)" />
        </div>
      </div>
    </div>
  </section>
</template>
