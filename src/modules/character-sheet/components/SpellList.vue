<script setup lang="ts">
import { computed, ref } from 'vue'
import { CBtn, openConfirmModal } from '@/ui/components'
import { searchFilterObject } from '@/composables/useFilters'
import SpellEditor from './SpellEditor.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import CollectionSearch from './shared/CollectionSearch.vue'
import type { CharacterSpell } from '../types/character'

const props = defineProps<{ title: string; spells: CharacterSpell[]; cantrip?: boolean; preparedIds?: string[]; showPreparedFilter?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ update: [spells: CharacterSpell[]]; 'update:prepared-ids': [ids: string[]] }>()
const editingId = ref<string | null>(null)
const draft = ref<CharacterSpell | null>(null)
const query = ref('')
const preparedOnly = ref(false)

const visibleSpells = computed(() => {
  const search = query.value.trim()
  const matches = search ? searchFilterObject(props.spells, ['name', 'description'], search) : props.spells
  return props.spells.filter((spell) => (spell.id === editingId.value || matches.includes(spell)) && (!preparedOnly.value || (props.preparedIds ?? []).includes(spell.id)))
})
function begin(spell: CharacterSpell) { editingId.value = spell.id; draft.value = { ...spell } }
function add() { const spell = { id: `${props.cantrip ? 'cantrip' : 'spell'}-${Date.now()}`, name: '', level: props.cantrip ? 0 : 1, description: '' }; draft.value = spell; editingId.value = spell.id }
function save(spell: CharacterSpell) { const exists = props.spells.some((item) => item.id === spell.id); emit('update', exists ? props.spells.map((item) => item.id === spell.id ? spell : item) : [...props.spells, spell]); editingId.value = null; draft.value = null }
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
    <div class="section-heading"><h2>{{ title }}</h2><CBtn color-type="accent" :disabled="disabled || editingId !== null" @click="add">Добавить</CBtn></div>
    <CollectionSearch v-model:query="query" :label="`Поиск: ${title.toLowerCase()}`" />
    <label v-if="showPreparedFilter" class="prepared-filter"><input v-model="preparedOnly" type="checkbox" :disabled="disabled"><span>Только подготовленные</span></label>
    <EmptyCollection v-if="spells.length === 0" :text="`${title} пока нет.`" />
    <EmptyCollection v-else-if="visibleSpells.length === 0" text="Совпадений не найдено." />
    <div v-for="spell in visibleSpells" :key="spell.id" class="entry-card spell-entry-card">
      <SpellEditor v-if="editingId === spell.id && draft" :spell="draft" :cantrip="cantrip" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
      <template v-else>
        <div class="spell-entry-content">
          <div class="spell-title"><div><h3>{{ spell.name || 'Без названия' }}</h3><span class="spell-kind-badge">{{ cantrip ? 'Заговор' : `Уровень ${spell.level}` }}</span></div><label v-if="showPreparedFilter" class="prepared-toggle"><input type="checkbox" :checked="(preparedIds ?? []).includes(spell.id)" :disabled="disabled" @change="togglePrepared(spell.id, $event)"><span>Подготовлено</span></label></div>
          <p v-if="spell.description">{{ spell.description }}</p>
        </div>
        <EntryActions :disabled="disabled" @edit="begin(spell)" @remove="remove(spell.id, spell.name)" />
      </template>
    </div>
    <SpellEditor v-if="editingId && !spells.some((spell) => spell.id === editingId) && draft" :spell="draft" :cantrip="cantrip" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
  </section>
</template>
