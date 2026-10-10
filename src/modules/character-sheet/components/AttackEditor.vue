<script setup lang="ts">
import { ref, watch } from 'vue'
import { CBtn, CInput, CTextarea } from '@/ui/components'
import { ATTACK_BONUS_SOURCES } from '../data/characterFields'
import { getRules2024Weapon, RULES_2024_WEAPON_MASTERIES, RULES_2024_WEAPONS } from '../data/rules2024/index.ts'
import { getAttackBonusSource, getAdditionalAttackBonus } from '../domain/attackBonus'
import type { CharacterAbilities } from '../types/character'
import type { CharacterAttackView } from '../types/characterView'

const props = defineProps<{ attack: CharacterAttackView; abilities: CharacterAbilities; level: number; disabled?: boolean }>()
const emit = defineEmits<{ save: [attack: CharacterAttackView]; cancel: [] }>()
const attackKinds = [{ value: 'melee', label: 'Ближняя' }, { value: 'ranged', label: 'Дальняя' }, { value: 'spell', label: 'Заклинание' }, { value: 'other', label: 'Другое' }] as const

function createDraft(attack: CharacterAttackView): CharacterAttackView {
  return { ...attack, properties: [...attack.properties], bonusSource: getAttackBonusSource(attack), additionalBonus: getAdditionalAttackBonus(attack) }
}
const draft = ref(createDraft(props.attack))
watch(() => props.attack, (value) => { draft.value = createDraft(value) }, { deep: true })
function numberValue(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.trunc(parsed) : 0 }
function updateProperties(value: unknown) { draft.value.properties = String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean) }
function updateWeapon(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  draft.value.weaponId = id || undefined
  draft.value.masteryId = id ? getRules2024Weapon(id)?.mastery ?? undefined : undefined
}
function updateMastery(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  draft.value.masteryId = id || undefined
}
function submit() {
  if (!draft.value.name.trim()) return
  emit('save', { ...draft.value, name: draft.value.name.trim(), properties: [...draft.value.properties], weaponId: draft.value.weaponId || undefined, masteryId: draft.value.masteryId || undefined, bonusSource: getAttackBonusSource(draft.value), additionalBonus: getAdditionalAttackBonus(draft.value) })
}
</script>

<template>
  <div class="editor-grid">
    <CInput v-model="draft.name" label="Название" :disabled="disabled" />
    <label class="compact-field">Тип атаки
      <select class="select-control" v-model="draft.kind" :disabled="disabled"><option v-for="kind in attackKinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option></select>
    </label>
    <label class="compact-field">Оружие из справочника
      <select class="select-control" :value="draft.weaponId ?? ''" :disabled="disabled" @change="updateWeapon"><option value="">Без связи</option><option v-for="weapon in RULES_2024_WEAPONS" :key="weapon.id" :value="weapon.id">{{ weapon.name }} ({{ weapon.category === 'melee' ? 'ближнее' : 'дальнее' }})</option></select>
    </label>
    <label class="compact-field">Мастерство (данные)
      <select class="select-control" :value="draft.masteryId ?? ''" :disabled="disabled" @change="updateMastery"><option value="">Не указано</option><option v-for="mastery in RULES_2024_WEAPON_MASTERIES" :key="mastery.id" :value="mastery.id">{{ mastery.name }}</option></select>
    </label>
    <CInput v-model="draft.attackBonus" label="Ручной бонус атаки" :disabled="disabled || draft.calculationMode !== 'manual'" />
    <label class="compact-field">Источник способности
      <select class="select-control" v-model="draft.bonusSource" :disabled="disabled"><option v-for="source in ATTACK_BONUS_SOURCES" :key="source.value" :value="source.value">{{ source.label }}</option></select>
    </label>
    <label class="compact-field">Режим бонуса
      <select class="select-control" v-model="draft.calculationMode" :disabled="disabled"><option value="manual">Ручной</option><option value="computed">Расчёт</option></select>
    </label>
    <label class="check-control attack-check"><input v-model="draft.proficient" type="checkbox" :disabled="disabled"><span>Добавлять бонус владения</span></label>
    <CInput type="number" step="1" label="Дополнительный бонус" :model-value="draft.additionalBonus" :disabled="disabled" @update:model-value="draft.additionalBonus = numberValue($event)" />
    <CInput v-model="draft.damage" label="Урон" :disabled="disabled" />
    <CInput v-model="draft.damageType" label="Тип урона" :disabled="disabled" />
    <CInput v-model="draft.range" label="Дистанция" :disabled="disabled" />
    <CInput v-if="!draft.weaponId" v-model="draft.weaponMastery" label="Текстовое мастерство (старый формат)" :disabled="disabled" />
    <CInput label="Свойства через запятую" :model-value="draft.properties.join(', ')" :disabled="disabled" @update:model-value="updateProperties" />
    <CTextarea v-model="draft.description" label="Описание" :disabled="disabled" rows="2" />
    <div class="editor-actions"><CBtn color-type="primary" :disabled="disabled" @click="submit">Применить</CBtn><CBtn :disabled="disabled" @click="emit('cancel')">Отмена</CBtn></div>
  </div>
</template>
