<script setup lang="ts">
import { computed, ref } from 'vue'
import { CInput, useDialog } from '@/ui/components'
import BestiaryEntryModal from './BestiaryEntryModal.vue'
import { bestiaryInitiativeParticipant, type BestiaryEntry, type BestiaryFilters, type BestiarySort } from '../types.ts'
import { mockBestiaryAdapter } from '../data/mockBestiary.ts'
import '../styles/bestiary.css'

const props = defineProps<{ onCreateNpc: (entry: BestiaryEntry) => void | Promise<void> }>()
const emit = defineEmits<{ status: [message: string] }>()
const { open, close } = useDialog()
const adapter = mockBestiaryAdapter()
const entries = ref<BestiaryEntry[]>(adapter.list().map((entry) => entry))
const filters = ref<BestiaryFilters>({ search: '', size: '', creatureType: '', alignment: '', challengeRating: '', environment: '', source: '', language: '', speed: '' })
const sort = ref<BestiarySort>('name')
const speedOptions = [{ value: '', label: 'Любая скорость' }, { value: '30', label: 'До 30 фт.' }, { value: '40', label: 'От 40 фт.' }]
function challengeValue(value: string): number {
  const [numerator = 0, denominator = 0] = value.split('/').map(Number)
  return Number.isFinite(denominator) && denominator > 0 ? numerator / denominator : Number.isFinite(numerator) ? numerator : 0
}

const options = computed(() => ({
  size: [...new Set(entries.value.map((entry) => entry.size))].sort(),
  creatureType: [...new Set(entries.value.map((entry) => entry.creatureType))].sort(),
  alignment: [...new Set(entries.value.map((entry) => entry.alignment))].sort(),
  challengeRating: [...new Set(entries.value.map((entry) => entry.challengeRating))].sort(),
  environment: [...new Set(entries.value.flatMap((entry) => entry.environment))].sort(),
  source: [...new Set(entries.value.map((entry) => entry.source))].sort(),
  language: [...new Set(entries.value.flatMap((entry) => entry.languages))].sort(),
}))
const filteredEntries = computed(() => {
  const query = filters.value.search.trim().toLocaleLowerCase('ru')
  const result = entries.value.filter((entry) => {
    if (query && !entry.name.toLocaleLowerCase('ru').includes(query)) return false
    if (filters.value.size && entry.size !== filters.value.size) return false
    if (filters.value.creatureType && entry.creatureType !== filters.value.creatureType) return false
    if (filters.value.alignment && entry.alignment !== filters.value.alignment) return false
    if (filters.value.challengeRating && entry.challengeRating !== filters.value.challengeRating) return false
    if (filters.value.environment && !entry.environment.includes(filters.value.environment)) return false
    if (filters.value.source && entry.source !== filters.value.source) return false
    if (filters.value.language && !entry.languages.includes(filters.value.language)) return false
    if (filters.value.speed === '30' && entry.speed > 30) return false
    if (filters.value.speed === '40' && entry.speed < 40) return false
    return true
  })
  return [...result].sort((left, right) => sort.value === 'name' ? left.name.localeCompare(right.name, 'ru') : sort.value === 'speed' ? right.speed - left.speed || left.name.localeCompare(right.name, 'ru') : challengeValue(right.challengeRating) - challengeValue(left.challengeRating) || left.name.localeCompare(right.name, 'ru'))
})

function openDetails(entry: BestiaryEntry) {
  open({ component: BestiaryEntryModal, componentProps: { entry, onCreateNpc: async (value: BestiaryEntry) => { await props.onCreateNpc(value); close() }, onAddInitiative: addToInitiative } })
}
function addToInitiative(entry: BestiaryEntry) {
  window.dispatchEvent(new CustomEvent('nastolka:add-initiative-participant', { detail: bestiaryInitiativeParticipant(entry) }))
  emit('status', `«${entry.name}» добавлен в трекер инициативы.`)
}
</script>

<template>
  <section class="bestiary-panel sheet-section" aria-labelledby="bestiary-title">
    <header class="bestiary-heading"><div><p class="eyebrow">Справочник</p><h1 id="bestiary-title">Бестиарий</h1><p class="section-note">Небольшой локальный каталог демонстрационных существ.</p></div><span class="mode-tag mode-ready">{{ filteredEntries.length }} записей</span></header>
    <div class="bestiary-controls" aria-label="Поиск и фильтры бестиария">
      <CInput v-model="filters.search" label="Поиск по названию" placeholder="Например, разведчик" />
      <label><span>Размер</span><select v-model="filters.size" class="select-control" aria-label="Фильтр по размеру"><option value="">Любой размер</option><option v-for="value in options.size" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Тип</span><select v-model="filters.creatureType" class="select-control" aria-label="Фильтр по типу"><option value="">Любой тип</option><option v-for="value in options.creatureType" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Мировоззрение</span><select v-model="filters.alignment" class="select-control" aria-label="Фильтр по мировоззрению"><option value="">Любое</option><option v-for="value in options.alignment" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Рейтинг опасности</span><select v-model="filters.challengeRating" class="select-control" aria-label="Фильтр по рейтингу опасности"><option value="">Любой</option><option v-for="value in options.challengeRating" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Среда</span><select v-model="filters.environment" class="select-control" aria-label="Фильтр по среде"><option value="">Любая</option><option v-for="value in options.environment" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Источник</span><select v-model="filters.source" class="select-control" aria-label="Фильтр по источнику"><option value="">Любой</option><option v-for="value in options.source" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Язык</span><select v-model="filters.language" class="select-control" aria-label="Фильтр по языку"><option value="">Любой</option><option v-for="value in options.language" :key="value" :value="value">{{ value }}</option></select></label>
      <label><span>Скорость</span><select v-model="filters.speed" class="select-control" aria-label="Фильтр по скорости"><option v-for="option in speedOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
      <label><span>Сортировка</span><select v-model="sort" class="select-control" aria-label="Сортировка бестиария"><option value="name">По имени</option><option value="challengeRating">По рейтингу опасности</option><option value="speed">По скорости</option></select></label>
    </div>
    <p v-if="!filteredEntries.length" class="empty-collection">Существа по выбранным фильтрам не найдены.</p>
    <div v-else class="bestiary-grid">
      <button v-for="entry in filteredEntries" :key="entry.id" type="button" class="bestiary-card" :aria-label="`Открыть существо ${entry.name}`" @click="openDetails(entry)">
        <span class="bestiary-card-mark" aria-hidden="true">✦</span><span class="bestiary-card-main"><strong>{{ entry.name }}</strong><small>{{ entry.size }} · {{ entry.creatureType }} · Опасность {{ entry.challengeRating }}</small><span>{{ entry.environment.join(' · ') }}</span></span><span class="bestiary-card-stats">КД {{ entry.armorClass }} · HP {{ entry.hitPoints }} · {{ entry.speed }} фт.</span>
      </button>
    </div>
  </section>
</template>
