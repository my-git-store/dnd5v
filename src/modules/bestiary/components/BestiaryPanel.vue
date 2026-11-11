<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import BestiaryEntryModal from './BestiaryEntryModal.vue'
import {
    bestiaryInitiativeParticipant,
    type BestiaryEntry,
    type BestiaryFilters,
    type BestiarySort,
} from '../types/bestiary.ts'
import { mockBestiaryAdapter } from '../data/mockBestiary.ts'
import '../styles/bestiary.css'

type Emits = {
    status: [message: string]
}

const props = defineProps<{ onCreateNpc: (entry: BestiaryEntry) => void | Promise<void> }>()

const emit = defineEmits<Emits>()

type EntryModalProps = {
    onCreateNpc: (entry: BestiaryEntry) => void | Promise<void>
    onAddInitiative: (entry: BestiaryEntry) => void
}

const entryModal = useModalUtil<BestiaryEntry, EntryModalProps>()

const adapter = mockBestiaryAdapter()

const entries = ref<BestiaryEntry[]>(adapter.list().map(entry => entry))

const filters = ref<BestiaryFilters>({
    search: '',
    size: '',
    creatureType: '',
    alignment: '',
    challengeRating: '',
    environment: '',
    source: '',
    language: '',
    speed: '',
})

const sort = ref<BestiarySort>('name')

const speedOptions = [
    { value: '', label: 'Любая скорость' },
    { value: '30', label: 'До 30 фт.' },
    { value: '40', label: 'От 40 фт.' },
]

const sortOptions = [
    { value: 'name', label: 'По имени' },
    { value: 'challengeRating', label: 'По рейтингу опасности' },
    { value: 'speed', label: 'По скорости' },
]

function filterOptions(values: string[], emptyLabel: string) {
    return [{ value: '', label: emptyLabel }, ...values.map(value => ({ value, label: value }))]
}
function challengeValue(value: string): number {
    const [numerator = 0, denominator = 0] = value.split('/').map(Number)
    return Number.isFinite(denominator) && denominator > 0
        ? numerator / denominator
        : Number.isFinite(numerator)
          ? numerator
          : 0
}

const options = computed(() => ({
    size: [...new Set(entries.value.map(entry => entry.size))].sort(),
    creatureType: [...new Set(entries.value.map(entry => entry.creatureType))].sort(),
    alignment: [...new Set(entries.value.map(entry => entry.alignment))].sort(),
    challengeRating: [...new Set(entries.value.map(entry => entry.challengeRating))].sort(),
    environment: [...new Set(entries.value.flatMap(entry => entry.environment))].sort(),
    source: [...new Set(entries.value.map(entry => entry.source))].sort(),
    language: [...new Set(entries.value.flatMap(entry => entry.languages))].sort(),
}))

const filteredEntries = computed(() => {
    const query = filters.value.search.trim().toLocaleLowerCase('ru')

    const result = entries.value.filter(entry => {
        if (query && !entry.name.toLocaleLowerCase('ru').includes(query)) return false
        if (filters.value.size && entry.size !== filters.value.size) return false
        if (filters.value.creatureType && entry.creatureType !== filters.value.creatureType)
            return false
        if (filters.value.alignment && entry.alignment !== filters.value.alignment) return false
        if (
            filters.value.challengeRating &&
            entry.challengeRating !== filters.value.challengeRating
        )
            return false
        if (filters.value.environment && !entry.environment.includes(filters.value.environment))
            return false
        if (filters.value.source && entry.source !== filters.value.source) return false
        if (filters.value.language && !entry.languages.includes(filters.value.language))
            return false
        if (filters.value.speed === '30' && entry.speed > 30) return false
        if (filters.value.speed === '40' && entry.speed < 40) return false
        return true
    })
    return [...result].sort((left, right) =>
        sort.value === 'name'
            ? left.name.localeCompare(right.name, 'ru')
            : sort.value === 'speed'
              ? right.speed - left.speed || left.name.localeCompare(right.name, 'ru')
              : challengeValue(right.challengeRating) - challengeValue(left.challengeRating) ||
                left.name.localeCompare(right.name, 'ru'),
    )
})

function openDetails(entry: BestiaryEntry) {
    entryModal.item.value = entry
    entryModal.props.value = {
        onCreateNpc: async (value: BestiaryEntry) => {
            await props.onCreateNpc(value)
            entryModal.openOrClose()
        },
        onAddInitiative: addToInitiative,
    }
    entryModal.openOrClose()
}
function addToInitiative(entry: BestiaryEntry) {
    window.dispatchEvent(
        new CustomEvent('nastolka:add-initiative-participant', {
            detail: bestiaryInitiativeParticipant(entry),
        }),
    )
    emit('status', `«${entry.name}» добавлен в трекер инициативы.`)
}
</script>

<template>
    <section class="bestiary-panel c-sheet-section" aria-labelledby="bestiary-title">
        <header class="bestiary-heading">
            <div>
                <p class="c-eyebrow">Справочник</p>
                <h1 id="bestiary-title">Бестиарий</h1>
                <p class="c-section-note">Небольшой локальный каталог демонстрационных существ.</p>
            </div>
            <span class="c-mode-tag mode-ready">{{ filteredEntries.length }} записей</span>
        </header>
        <div class="bestiary-controls" aria-label="Поиск и фильтры бестиария">
            <NFormItem label="Поиск по названию"
                ><NInput v-model:value="filters.search" placeholder="Например, разведчик"
            /></NFormItem>
            <label
                ><span>Размер</span
                ><NSelect
                    v-model:value="filters.size"
                    class="c-select-control"
                    :options="filterOptions(options.size, 'Любой размер')"
                    aria-label="Фильтр по размеру"
            /></label>
            <label
                ><span>Тип</span
                ><NSelect
                    v-model:value="filters.creatureType"
                    class="c-select-control"
                    :options="filterOptions(options.creatureType, 'Любой тип')"
                    aria-label="Фильтр по типу"
            /></label>
            <label
                ><span>Мировоззрение</span
                ><NSelect
                    v-model:value="filters.alignment"
                    class="c-select-control"
                    :options="filterOptions(options.alignment, 'Любое')"
                    aria-label="Фильтр по мировоззрению"
            /></label>
            <label
                ><span>Рейтинг опасности</span
                ><NSelect
                    v-model:value="filters.challengeRating"
                    class="c-select-control"
                    :options="filterOptions(options.challengeRating, 'Любой')"
                    aria-label="Фильтр по рейтингу опасности"
            /></label>
            <label
                ><span>Среда</span
                ><NSelect
                    v-model:value="filters.environment"
                    class="c-select-control"
                    :options="filterOptions(options.environment, 'Любая')"
                    aria-label="Фильтр по среде"
            /></label>
            <label
                ><span>Источник</span
                ><NSelect
                    v-model:value="filters.source"
                    class="c-select-control"
                    :options="filterOptions(options.source, 'Любой')"
                    aria-label="Фильтр по источнику"
            /></label>
            <label
                ><span>Язык</span
                ><NSelect
                    v-model:value="filters.language"
                    class="c-select-control"
                    :options="filterOptions(options.language, 'Любой')"
                    aria-label="Фильтр по языку"
            /></label>
            <label
                ><span>Скорость</span
                ><NSelect
                    v-model:value="filters.speed"
                    class="c-select-control"
                    :options="speedOptions"
                    aria-label="Фильтр по скорости"
            /></label>
            <label
                ><span>Сортировка</span
                ><NSelect
                    v-model:value="sort"
                    class="c-select-control"
                    :options="sortOptions"
                    aria-label="Сортировка бестиария"
            /></label>
        </div>
        <p v-if="!filteredEntries.length" class="c-empty-collection">
            Существа по выбранным фильтрам не найдены.
        </p>
        <div v-else class="bestiary-grid">
            <button
                v-for="entry in filteredEntries"
                :key="entry.id"
                type="button"
                class="bestiary-card"
                :aria-label="`Открыть существо ${entry.name}`"
                @click="openDetails(entry)"
            >
                <span class="bestiary-card-mark" aria-hidden="true">✦</span
                ><span class="bestiary-card-main"
                    ><strong>{{ entry.name }}</strong
                    ><small
                        >{{ entry.size }} · {{ entry.creatureType }} · Опасность
                        {{ entry.challengeRating }}</small
                    ><span>{{ entry.environment.join(' · ') }}</span></span
                ><span class="bestiary-card-stats"
                    >КД {{ entry.armorClass }} · HP {{ entry.hitPoints }} ·
                    {{ entry.speed }} фт.</span
                >
            </button>
        </div>
        <BestiaryEntryModal
            v-if="entryModal.isShowModal.value && entryModal.item.value && entryModal.props.value"
            :entry="entryModal.item.value"
            v-bind="entryModal.props.value"
            @close="entryModal.openOrClose"
        />
    </section>
</template>

<style scoped>
.c-character-sheet .bestiary-controls :deep(label) {
    row-gap: 8px;
}
</style>
