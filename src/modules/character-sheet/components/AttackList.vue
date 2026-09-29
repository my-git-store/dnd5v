<script setup lang="ts">
import { ref } from 'vue'
import { CBtn } from '@/ui/components'
import AttackEditor from './AttackEditor.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import type { CharacterAttack } from '../types/character'
const props = defineProps<{ attacks: CharacterAttack[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [attacks: CharacterAttack[]] }>()
const editingId = ref<string | null>(null)
const draft = ref<CharacterAttack | null>(null)
function begin(attack: CharacterAttack) { editingId.value = attack.id; draft.value = { ...attack } }
function add() { const attack = { id: `attack-${Date.now()}`, name: '', attackBonus: '', damage: '', description: '' }; draft.value = attack; editingId.value = attack.id }
function save(attack: CharacterAttack) { const exists = props.attacks.some((item) => item.id === attack.id); emit('update', exists ? props.attacks.map((item) => item.id === attack.id ? attack : item) : [...props.attacks, attack]); editingId.value = null; draft.value = null }
function remove(id: string) { if (window.confirm('Удалить эту атаку?')) emit('update', props.attacks.filter((item) => item.id !== id)) }
</script>
<template>
  <section class="sheet-section"><div class="section-heading"><h2>Атаки</h2><CBtn color-type="accent" :disabled="disabled || editingId !== null" @click="add">Добавить</CBtn></div>
    <EmptyCollection v-if="attacks.length === 0" text="Атак пока нет." />
    <div v-for="attack in attacks" :key="attack.id" class="entry-card">
      <AttackEditor v-if="editingId === attack.id && draft" :attack="draft" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
      <template v-else><div><h3>{{ attack.name }}</h3><p>{{ attack.attackBonus }} · {{ attack.damage }}</p><p v-if="attack.description">{{ attack.description }}</p></div><EntryActions :disabled="disabled" @edit="begin(attack)" @remove="remove(attack.id)" /></template>
    </div>
    <AttackEditor v-if="editingId && !attacks.some((attack) => attack.id === editingId) && draft" :attack="draft" :disabled="disabled" @save="save" @cancel="editingId = null; draft = null" />
  </section>
</template>
