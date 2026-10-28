<script setup lang="ts">
import { ref } from 'vue'
import { CBtn, CModal, useDialog } from '@/ui/components'
import { BESTIARY_ABILITY_KEYS, bestiaryAbilityModifier, type BestiaryEntry } from '../types.ts'

const props = defineProps<{
  entry: BestiaryEntry
  onCreateNpc: (entry: BestiaryEntry) => void | Promise<void>
  onAddInitiative: (entry: BestiaryEntry) => void
}>()
const emit = defineEmits<{ close: [] }>()
const { close } = useDialog()
const copied = ref(false)
const busy = ref(false)
const abilityLabels: Record<string, string> = { strength: 'Сила', dexterity: 'Ловкость', constitution: 'Телосложение', intelligence: 'Интеллект', wisdom: 'Мудрость', charisma: 'Харизма' }

async function copyData() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.entry, null, 2))
    copied.value = true
  } catch {
    copied.value = false
  }
}
async function createNpc() {
  if (busy.value) return
  busy.value = true
  try { await props.onCreateNpc(props.entry) } finally { busy.value = false }
}
function addToInitiative() {
  if (busy.value) return
  props.onAddInitiative(props.entry)
}
</script>

<template>
  <CModal class="bestiary-entry-modal" @close="emit('close')">
    <article class="bestiary-detail-card" role="dialog" aria-modal="true" :aria-label="`Существо: ${entry.name}`">
      <header class="bestiary-detail-header">
        <div><p class="eyebrow">Бестиарий · {{ entry.source }}</p><h2>{{ entry.name }}</h2><p class="section-note">{{ entry.size }} · {{ entry.creatureType }} · {{ entry.alignment }}</p></div>
        <CBtn aria-label="Закрыть сведения о существе" @click="close">Закрыть</CBtn>
      </header>
      <div class="bestiary-detail-actions">
        <CBtn color-type="primary" :disabled="busy" @click="createNpc">Создать НПС на основе существа</CBtn>
        <CBtn color-type="accent" :disabled="busy" @click="addToInitiative">Добавить в инициативу</CBtn>
        <CBtn color-type="accent" @click="copyData">{{ copied ? 'Данные скопированы' : 'Скопировать данные' }}</CBtn>
      </div>
      <dl class="bestiary-stat-grid">
        <div><dt>Размер и тип</dt><dd>{{ entry.size }} · {{ entry.creatureType }}</dd></div>
        <div><dt>Мировоззрение</dt><dd>{{ entry.alignment }}</dd></div>
        <div><dt>Рейтинг опасности</dt><dd>{{ entry.challengeRating }}</dd></div>
        <div><dt>КД</dt><dd>{{ entry.armorClass }}</dd></div>
        <div><dt>HP</dt><dd>{{ entry.hitPoints }}</dd></div>
        <div><dt>Скорость</dt><dd>{{ entry.speed }} фт.</dd></div>
        <div><dt>Среда</dt><dd>{{ entry.environment.join(' · ') }}</dd></div>
        <div><dt>Языки</dt><dd>{{ entry.languages.length ? entry.languages.join(' · ') : 'Нет' }}</dd></div>
      </dl>
      <section class="bestiary-detail-section"><h3>Характеристики</h3><div class="bestiary-ability-grid"><div v-for="key in BESTIARY_ABILITY_KEYS" :key="key"><span>{{ abilityLabels[key] }}</span><strong>{{ entry.abilities[key] }}</strong><small>{{ bestiaryAbilityModifier(entry.abilities[key]) >= 0 ? '+' : '' }}{{ bestiaryAbilityModifier(entry.abilities[key]) }}</small></div></div></section>
      <section v-if="entry.savingThrows.length || entry.skills.length" class="bestiary-detail-section"><h3>Навыки и спасброски</h3><p v-if="entry.skills.length">Навыки: {{ entry.skills.map(item => `${item.name} ${item.value >= 0 ? '+' : ''}${item.value}`).join(' · ') }}</p><p v-if="entry.savingThrows.length">Спасброски: {{ entry.savingThrows.map(item => `${item.name} ${item.value >= 0 ? '+' : ''}${item.value}`).join(' · ') }}</p></section>
      <section class="bestiary-detail-section"><h3>Чувства</h3><p>{{ entry.senses || 'Не указаны' }}</p></section>
      <section v-for="section in [{ title: 'Особенности', entries: entry.features }, { title: 'Действия', entries: entry.actions }, { title: 'Реакции', entries: entry.reactions }, { title: 'Легендарные действия', entries: entry.legendaryActions }]" v-show="section.entries.length" :key="section.title" class="bestiary-detail-section"><h3>{{ section.title }}</h3><details v-for="item in section.entries" :key="item.id" class="bestiary-long-entry"><summary>{{ item.name }}<span v-if="item.attackBonus || item.damage"> · {{ item.attackBonus }}<span v-if="item.attackBonus && item.damage"> · </span>{{ item.damage }}</span></summary><p>{{ item.description }}</p></details></section>
    </article>
  </CModal>
</template>
