<script setup lang="ts">
import { CBtn, openConfirmModal, useDialog } from '@/ui/components'
import CharacterFeatEditorModal from './CharacterFeatEditorModal.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import type { CharacterFeatV3 } from '../types/characterV3'

const props = defineProps<{ feats: CharacterFeatV3[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [feats: CharacterFeatV3[]] }>()
const { open } = useDialog()

function save(feat: CharacterFeatV3) {
  const exists = props.feats.some((item) => item.id === feat.id)
  emit('update', exists ? props.feats.map((item) => item.id === feat.id ? feat : item) : [...props.feats, feat])
}
function openEditor(feat: CharacterFeatV3) { open({ component: CharacterFeatEditorModal, componentProps: { feat: { ...feat }, disabled: props.disabled, onSave: save } }) }
function add() { openEditor({ id: `feat-${Date.now()}`, name: '', description: '' }) }
function remove(id: string, name: string) { openConfirmModal({ text: `удалить черту «${name || 'без названия'}»?`, onOk: () => emit('update', props.feats.filter((feat) => feat.id !== id)) }) }
</script>

<template>
  <section class="sheet-section feats-section">
    <div class="section-heading"><div><h2>Черты персонажа</h2><p class="section-note">Пользовательские записи без автоматического применения эффектов.</p></div><CBtn color-type="accent" :disabled="disabled" @click="add">Добавить</CBtn></div>
    <EmptyCollection v-if="feats.length === 0" text="Черты пока не добавлены." />
    <div v-for="feat in feats" :key="feat.id" class="entry-card feat-entry-card">
      <div class="feat-entry-content"><h3 :title="feat.name || 'Без названия'">{{ feat.name || 'Без названия' }}</h3></div>
      <EntryActions :disabled="disabled" @edit="openEditor(feat)" @remove="remove(feat.id, feat.name)" />
    </div>
  </section>
</template>
