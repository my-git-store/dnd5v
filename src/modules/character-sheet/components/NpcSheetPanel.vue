<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CBtn, CInput, useDialog } from '@/ui/components'
import { abilityModifier, signedModifier } from '../domain/abilityModifier'
import { createDefaultNpcProfile } from '../domain/npc'
import NpcEntryEditorModal from './NpcEntryEditorModal.vue'
import type { CharacterSheetView } from '../types/characterView'
import type { CharacterNpcBonusV3, CharacterNpcEntryV3, CharacterNpcV3 } from '../types/characterV3'

const props = defineProps<{ character: CharacterSheetView; dirty: boolean; saving: boolean; saved: boolean; saveError: string | null; onSave: () => void | Promise<void>; onPrint: () => void }>()
const emit = defineEmits<{ update: [npc: CharacterNpcV3] }>()
const { open } = useDialog()
const draft = ref<CharacterNpcV3>(JSON.parse(JSON.stringify(props.character.npc ?? createDefaultNpcProfile(props.character.name))) as CharacterNpcV3)
const abilityKeys = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
const abilityLabels: Record<typeof abilityKeys[number], string> = { strength: 'Сила', dexterity: 'Ловкость', constitution: 'Телосложение', intelligence: 'Интеллект', wisdom: 'Мудрость', charisma: 'Харизма' }
const initiative = computed(() => draft.value.initiative.mode === 'manual'
  ? signedModifier(draft.value.initiative.value ?? 0)
  : signedModifier(abilityModifier(draft.value.abilities.dexterity) + draft.value.initiative.additionalBonus))
function snapshot(value: CharacterNpcV3 | undefined): string { return JSON.stringify(value ?? null) }
watch(() => props.character.npc, value => {
  if (value && snapshot(value) !== snapshot(draft.value)) draft.value = JSON.parse(JSON.stringify(value)) as CharacterNpcV3
}, { deep: true })
watch(draft, value => {
  if (snapshot(value) !== snapshot(props.character.npc)) emit('update', JSON.parse(JSON.stringify(value)) as CharacterNpcV3)
}, { deep: true })

function integer(value: unknown, fallback = 0): number { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback }
function updateNumber(path: 'proficiencyBonus' | 'speed' | 'armorClass' | 'armorBonus' | 'hpMax' | 'hpCurrent' | 'hpTemporary' | 'initiativeBonus', value: unknown) {
  const parsed = integer(value)
  if (path === 'proficiencyBonus') draft.value.proficiencyBonus = parsed
  if (path === 'speed') draft.value.speed = parsed
  if (path === 'armorClass') draft.value.armorClass.value = parsed
  if (path === 'armorBonus') draft.value.armorClass.additionalBonus = parsed
  if (path === 'hpMax') { draft.value.hitPoints.max = parsed; draft.value.hitPoints.current = Math.min(draft.value.hitPoints.current, parsed) }
  if (path === 'hpCurrent') draft.value.hitPoints.current = Math.min(parsed, draft.value.hitPoints.max)
  if (path === 'hpTemporary') draft.value.hitPoints.temporary = parsed
  if (path === 'initiativeBonus') draft.value.initiative.additionalBonus = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0
}
function setCalculationMode(target: 'armorClass' | 'initiative', value: string) {
  if (value !== 'manual' && value !== 'computed') return
  if (target === 'armorClass') draft.value.armorClass.mode = value
  else draft.value.initiative.mode = value
}
function updateInitiativeValue(value: unknown) {
  const parsed = Number(value)
  draft.value.initiative.value = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}
function updateAbility(key: typeof abilityKeys[number], value: unknown) { draft.value.abilities[key] = integer(value, 10) }
function addBonus(kind: 'skills' | 'savingThrows') {
  draft.value[kind].push({ id: `npc-${kind}-${Date.now()}`, name: '', value: 0 })
}
function removeBonus(kind: 'skills' | 'savingThrows', id: string) { draft.value[kind] = draft.value[kind].filter(entry => entry.id !== id) }
function updateBonus(entry: CharacterNpcBonusV3, value: unknown) { entry.value = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0 }
function saveEntry(kind: 'features' | 'actions', entry: CharacterNpcEntryV3) {
  const entries = draft.value[kind]
  const index = entries.findIndex(current => current.id === entry.id)
  if (index >= 0) entries[index] = entry
  else entries.push(entry)
}
function openEntry(kind: 'features' | 'actions', entry?: CharacterNpcEntryV3) {
  const next = entry ? { ...entry } : { id: `npc-${kind}-${Date.now()}`, name: '', description: '', attackBonus: '', damage: '' }
  open({ component: NpcEntryEditorModal, componentProps: { entry: next, onSave: (value: CharacterNpcEntryV3) => saveEntry(kind, value) } })
}
function removeEntry(kind: 'features' | 'actions', id: string) { draft.value[kind] = draft.value[kind].filter(entry => entry.id !== id) }
</script>

<template>
  <div class="npc-sheet-panel">
    <header class="npc-sheet-header">
      <div>
        <p class="eyebrow">Режим НПС</p>
        <h1>{{ draft.name || 'Новый НПС' }}</h1>
        <p class="section-note">Отдельный компактный лист существа без прогрессии персонажа.</p>
      </div>
      <div class="npc-sheet-actions">
        <CBtn color-type="accent" :disabled="saving" @click="onPrint">Печать НПС</CBtn>
        <CBtn color-type="primary" :loading="saving" :disabled="!dirty" @click="onSave">{{ saved ? 'Сохранено' : 'Сохранить' }}</CBtn>
      </div>
    </header>
    <p v-if="saveError" class="status-text error" role="alert" aria-live="assertive">{{ saveError }}</p>
    <p v-else-if="dirty" class="status-text warning" role="status" aria-live="polite">Есть несохранённые изменения</p>
    <p v-else-if="saved" class="status-text success" role="status" aria-live="polite">Сохранено</p>

    <section class="sheet-section npc-identity-section" aria-labelledby="npc-identity-title">
      <div class="section-heading"><h2 id="npc-identity-title">Основные сведения НПС</h2><span class="mode-tag mode-ready">НПС</span></div>
      <div class="npc-field-grid">
        <CInput v-model="draft.name" label="Имя" />
        <CInput v-model="draft.creatureType" label="Тип существа" />
        <CInput v-model="draft.size" label="Размер" />
        <CInput v-model="draft.alignment" label="Мировоззрение" />
        <CInput v-model="draft.challengeRating" label="Рейтинг опасности" />
        <CInput type="number" min="0" label="Бонус мастерства" :model-value="draft.proficiencyBonus" @update:model-value="updateNumber('proficiencyBonus', $event)" />
        <label class="npc-mode-field"><span>Класс доспеха</span><select class="select-control" :value="draft.armorClass.mode" aria-label="Режим класса доспеха" @change="setCalculationMode('armorClass', ($event.target as HTMLSelectElement).value)"><option value="manual">Вручную</option><option value="computed">Расчёт</option></select></label>
        <CInput type="number" min="0" label="Значение КД" :model-value="draft.armorClass.value" @update:model-value="updateNumber('armorClass', $event)" />
        <CInput type="number" min="0" label="Добавка к КД" :model-value="draft.armorClass.additionalBonus" @update:model-value="updateNumber('armorBonus', $event)" />
        <CInput type="number" min="0" label="Максимум HP" :model-value="draft.hitPoints.max" @update:model-value="updateNumber('hpMax', $event)" />
        <CInput type="number" min="0" label="Текущие HP" :model-value="draft.hitPoints.current" @update:model-value="updateNumber('hpCurrent', $event)" />
        <CInput type="number" min="0" label="Временные HP" :model-value="draft.hitPoints.temporary" @update:model-value="updateNumber('hpTemporary', $event)" />
        <CInput type="number" min="0" label="Скорость" :model-value="draft.speed" @update:model-value="updateNumber('speed', $event)" />
        <label class="npc-mode-field"><span>Режим инициативы</span><select class="select-control" :value="draft.initiative.mode ?? 'computed'" aria-label="Режим инициативы" @change="setCalculationMode('initiative', ($event.target as HTMLSelectElement).value)"><option value="computed">Расчёт</option><option value="manual">Вручную</option></select></label>
        <CInput v-if="draft.initiative.mode !== 'manual'" type="number" label="Добавка к инициативе" :model-value="draft.initiative.additionalBonus" @update:model-value="updateNumber('initiativeBonus', $event)" />
        <CInput v-else type="number" label="Ручная инициатива" :model-value="draft.initiative.value ?? 0" @update:model-value="updateInitiativeValue($event)" />
        <div class="npc-derived-card"><span>Инициатива</span><strong>{{ initiative }}</strong><small>{{ draft.initiative.mode === 'manual' ? 'Ручное значение' : 'Расчёт: модификатор Ловкости + добавка' }}</small></div>
        <CInput v-model="draft.senses" label="Чувства" />
        <CInput v-model="draft.languages" label="Языки" />
      </div>
    </section>

    <section class="sheet-section" aria-labelledby="npc-abilities-title">
      <div class="section-heading"><h2 id="npc-abilities-title">Характеристики</h2><span class="mode-tag mode-ready">Расчёт</span></div>
      <div class="npc-ability-grid"><div v-for="key in abilityKeys" :key="key" class="field-card"><CInput type="number" min="1" max="30" :label="abilityLabels[key]" :model-value="draft.abilities[key]" @update:model-value="updateAbility(key, $event)" /><strong class="npc-ability-modifier">{{ signedModifier(abilityModifier(draft.abilities[key])) }}</strong></div></div>
    </section>

    <section class="sheet-section" aria-labelledby="npc-bonuses-title">
      <div class="section-heading"><h2 id="npc-bonuses-title">Навыки и спасброски</h2></div>
      <div class="npc-bonus-columns">
        <div><div class="npc-subheading"><h3>Навыки</h3><CBtn @click="addBonus('skills')">Добавить</CBtn></div><p v-if="!draft.skills.length" class="empty-collection">Навыки не указаны.</p><div v-for="entry in draft.skills" :key="entry.id" class="npc-bonus-row"><CInput v-model="entry.name" label="Название" /><CInput type="number" label="Бонус" :model-value="entry.value" @update:model-value="updateBonus(entry, $event)" /><CBtn color-type="delete" aria-label="Удалить навык" @click="removeBonus('skills', entry.id)">Удалить</CBtn></div></div>
        <div><div class="npc-subheading"><h3>Спасброски</h3><CBtn @click="addBonus('savingThrows')">Добавить</CBtn></div><p v-if="!draft.savingThrows.length" class="empty-collection">Спасброски не указаны.</p><div v-for="entry in draft.savingThrows" :key="entry.id" class="npc-bonus-row"><CInput v-model="entry.name" label="Название" /><CInput type="number" label="Бонус" :model-value="entry.value" @update:model-value="updateBonus(entry, $event)" /><CBtn color-type="delete" aria-label="Удалить спасбросок" @click="removeBonus('savingThrows', entry.id)">Удалить</CBtn></div></div>
      </div>
    </section>

    <section v-for="kind in (['features', 'actions'] as const)" :key="kind" class="sheet-section" :aria-labelledby="`npc-${kind}-title`">
      <div class="section-heading"><h2 :id="`npc-${kind}-title`">{{ kind === 'features' ? 'Особенности' : 'Действия' }}</h2><CBtn color-type="accent" @click="openEntry(kind)">Добавить</CBtn></div>
      <p v-if="!draft[kind].length" class="empty-collection">{{ kind === 'features' ? 'Особенности пока не добавлены.' : 'Действия пока не добавлены.' }}</p>
      <div v-for="entry in draft[kind]" :key="entry.id" class="entry-card npc-entry-card"><div><h3>{{ entry.name || 'Без названия' }}</h3><p>{{ entry.description || 'Описание не указано.' }}</p><small v-if="entry.attackBonus || entry.damage">{{ entry.attackBonus }}<span v-if="entry.attackBonus && entry.damage"> · </span>{{ entry.damage }}</small></div><div class="entry-actions"><CBtn @click="openEntry(kind, entry)">Изменить</CBtn><CBtn color-type="delete" @click="removeEntry(kind, entry.id)">Удалить</CBtn></div></div>
    </section>
  </div>
</template>
