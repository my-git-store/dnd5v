<script setup lang="ts">
import { ref } from 'vue'
import { CBtn } from '@/ui/components'
import SpellEditor from './SpellEditor.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import type { CharacterSpell } from '../types/character'
const props = defineProps<{ title: string; spells: CharacterSpell[]; cantrip?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ update: [spells: CharacterSpell[]] }>()
const editingId = ref<string | null>(null)
const draft = ref<CharacterSpell | null>(null)
function begin(spell: CharacterSpell) { editingId.value = spell.id; draft.value = { ...spell } }
function add() { const spell = { id: `${props.cantrip ? 'cantrip' : 'spell'}-${Date.now()}`, name: '', level: props.cantrip ? 0 : 1, description: '' }; draft.value = spell; editingId.value = spell.id }
function save(spell: CharacterSpell) { const exists = props.spells.some((item) => item.id === spell.id); emit('update', exists ? props.spells.map((item) => item.id === spell.id ? spell : item) : [...props.spells, spell]); editingId.value = null; draft.value = null }
function remove(id: string) { if (window.confirm('Удалить эту запись?')) emit('update', props.spells.filter((item) => item.id !== id)) }
</script>
<template>
  <section class="sheet-section"><div class="section-heading"><h2>{{ title }}</h2><CBtn color-type="accent" :disabled="disabled || editingId !== null" @click="add">Добавить</CBtn></div>
    <EmptyCollection v-if="spells.length === 0" :text="`${title} пока нет.`" />
    <div v-for="spell in spells" :key="spell.id" class="entry-card"><SpellEditor v-if="editingId === spell.id && draft" :spell="draft" :cantrip="cantrip" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" /><template v-else><div><h3>{{ spell.name }}</h3><p>{{ cantrip ? 'Заговор' : `Уровень ${spell.level}` }}</p><p v-if="spell.description">{{ spell.description }}</p></div><EntryActions :disabled="disabled" @edit="begin(spell)" @remove="remove(spell.id)" /></template></div>
    <SpellEditor v-if="editingId && !spells.some((spell) => spell.id === editingId) && draft" :spell="draft" :cantrip="cantrip" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
  </section>
</template>
