<script setup lang="ts">
import { computed, ref } from 'vue'
import { CBtn, openConfirmModal, useDialog } from '@/ui/components'
import { searchFilterObject } from '@/composables/useFilters'
import SpellEditorModal from './SpellEditorModal.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import CollectionSearch from './shared/CollectionSearch.vue'
import type { CharacterSpell } from '../types/character'
import { RULES_2024_CLASSES, getRules2024Spell } from '../data/rules2024/index.ts'

const props = defineProps<{ title: string; spells: CharacterSpell[]; cantrip?: boolean; preparedIds?: string[]; showPreparedFilter?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ update: [spells: CharacterSpell[]]; 'update:prepared-ids': [ids: string[]] }>()
const query = ref('')
const preparedOnly = ref(false)
const { open } = useDialog()
const classLabels = new Map(RULES_2024_CLASSES.map((item) => [item.id, item.label]))

function catalogSpell(spell: CharacterSpell) {
  return getRules2024Spell(spell.id)
}

function schoolLabel(spell: CharacterSpell): string {
  return spell.school || catalogSpell(spell)?.school || ''
}

function classLabel(spell: CharacterSpell): string {
  const classes = spell.classes ?? catalogSpell(spell)?.classes ?? []
  return classes.map((id) => classLabels.get(id) ?? id).join(' · ')
}

function metadataLabel(spell: CharacterSpell): string {
  const metadata = spell.metadata ?? catalogSpell(spell)?.metadata
  if (!metadata) return ''
  return Object.entries(metadata)
    .filter(([key]) => key !== 'referenceOnly')
    .map(([key, value]) => `${key === 'source' ? 'Источник' : key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
    .join(' · ')
}

const visibleSpells = computed(() => {
  const search = query.value.trim()
  const matches = search ? searchFilterObject(props.spells, ['name', 'description'], search) : props.spells
  return props.spells.filter((spell) => matches.includes(spell) && (!preparedOnly.value || (props.preparedIds ?? []).includes(spell.id)))
})
function save(spell: CharacterSpell) {
  const exists = props.spells.some((item) => item.id === spell.id)
  emit('update', exists ? props.spells.map((item) => item.id === spell.id ? spell : item) : [...props.spells, spell])
}
function openEditor(spell: CharacterSpell) {
  open({ component: SpellEditorModal, componentProps: { spell: { ...spell }, cantrip: props.cantrip, disabled: props.disabled, onSave: save } })
}
function add() { openEditor({ id: `${props.cantrip ? 'cantrip' : 'spell'}-${Date.now()}`, name: '', level: props.cantrip ? 0 : 1, description: '' }) }
function remove(id: string, name: string) {
  openConfirmModal({ text: `удалить запись «${name || 'без названия'}»?`, onOk: () => emit('update', props.spells.filter((item) => item.id !== id)) })
}
function togglePrepared(id: string, event: Event) {
  const prepared = new Set(props.preparedIds ?? [])
  if ((event.target as HTMLInputElement).checked) prepared.add(id)
  else prepared.delete(id)
  emit('update:prepared-ids', [...prepared])
}
</script>

<template>
  <section class="sheet-section spellbook-section">
    <div class="section-heading"><h2>{{ title }}</h2><CBtn color-type="accent" :disabled="disabled" @click="add">Добавить</CBtn></div>
    <CollectionSearch v-model:query="query" :label="`Поиск: ${title.toLowerCase()}`" />
    <label v-if="showPreparedFilter" class="prepared-filter"><input v-model="preparedOnly" type="checkbox" :disabled="disabled"><span>Только подготовленные</span></label>
    <EmptyCollection v-if="spells.length === 0" :text="`${title} пока нет.`" />
    <EmptyCollection v-else-if="visibleSpells.length === 0" text="Совпадений не найдено." />
    <div v-for="spell in visibleSpells" :key="spell.id" class="entry-card spell-entry-card">
      <div class="spell-entry-content">
        <div class="spell-title"><div><h3>{{ spell.name || 'Без названия' }}</h3><span class="spell-kind-badge">{{ cantrip ? 'Заговор' : `Уровень ${spell.level}` }}</span></div><label v-if="showPreparedFilter" class="prepared-toggle"><input type="checkbox" :checked="(preparedIds ?? []).includes(spell.id)" :disabled="disabled" @change="togglePrepared(spell.id, $event)"><span>Подготовлено</span></label></div>
        <div class="spell-meta-line"><span v-if="schoolLabel(spell)">Школа: {{ schoolLabel(spell) }}</span><span v-if="classLabel(spell)">Классы: {{ classLabel(spell) }}</span><span v-if="metadataLabel(spell)">{{ metadataLabel(spell) }}</span></div>
        <p v-if="spell.description">{{ spell.description }}</p>
      </div>
      <EntryActions :disabled="disabled" @edit="openEditor(spell)" @remove="remove(spell.id, spell.name)" />
    </div>
  </section>
</template>
