<script setup lang="ts">
import { computed } from 'vue'
import { CInput } from '@/ui/components'
import { abilityModifier, signedModifier } from '../domain/abilityModifier'
import type { CharacterAbilities } from '../types/character'
import type { CharacterArmorClassV3, CharacterCombatV3 } from '../types/characterV3'

const props = defineProps<{ combat: CharacterCombatV3; abilities: CharacterAbilities; disabled?: boolean }>()
const emit = defineEmits<{ update: [combat: CharacterCombatV3] }>()

const armorClass = computed(() => {
  const ac = props.combat.armorClass
  if (ac.mode === 'manual') return ac.value
  const dexterity = abilityModifier(props.abilities.dexterity)
  const dexBonus = ac.armorBase === null || ac.armorDexCap === null ? dexterity : Math.min(dexterity, ac.armorDexCap)
  return (ac.armorBase ?? 10) + dexBonus + ac.shieldBonus + ac.additionalBonus
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
function updateArmor(patch: Partial<CharacterArmorClassV3>) { const next = copy(); Object.assign(next.armorClass, patch); emit('update', next) }
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
        <label class="compact-field">Режим КД
          <select class="select-control" :value="combat.armorClass.mode" :disabled="disabled" @change="updateArmor({ mode: ($event.target as HTMLSelectElement).value === 'computed' ? 'computed' : 'manual' })">
            <option value="manual">Ручной</option><option value="computed">Расчёт</option>
          </select>
        </label>
        <p class="mode-tag" :class="combat.armorClass.mode === 'manual' ? 'mode-manual' : 'mode-computed'">{{ combat.armorClass.mode === 'manual' ? 'Ручное значение' : 'Расчёт: броня + Ловкость + щит + добавка' }}</p>
        <CInput v-if="combat.armorClass.mode === 'manual'" type="number" min="0" step="1" label="КД вручную" :model-value="combat.armorClass.value" :disabled="disabled" @update:model-value="updateArmor({ value: numberValue($event) })" />
        <div v-else class="combat-subgrid">
          <CInput type="number" min="0" step="1" label="База брони (пусто = 10)" :model-value="combat.armorClass.armorBase ?? ''" :disabled="disabled" @update:model-value="updateArmor({ armorBase: nullableNumber($event) })" />
          <CInput type="number" step="1" label="Предел Ловкости" :model-value="combat.armorClass.armorDexCap ?? ''" :disabled="disabled" @update:model-value="updateArmor({ armorDexCap: nullableNumber($event) })" />
          <CInput type="number" step="1" label="Бонус щита" :model-value="combat.armorClass.shieldBonus" :disabled="disabled" @update:model-value="updateArmor({ shieldBonus: numberValue($event) })" />
          <CInput type="number" step="1" label="Доп. бонус КД" :model-value="combat.armorClass.additionalBonus" :disabled="disabled" @update:model-value="updateArmor({ additionalBonus: numberValue($event) })" />
        </div>
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
