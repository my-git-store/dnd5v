<script setup lang="ts">
import { openConfirmModal } from '@/modules/character-sheet/components/modals'
import { useDialog } from '@/modules/character-sheet/composables/useDialog'
import CharacterFeatEditorModal from './CharacterFeatEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterFeat } from '@/modules/character-sheet/types/character'

const props = defineProps<{ feats: CharacterFeat[]; disabled?: boolean }>()

const emit = defineEmits<{ update: [feats: CharacterFeat[]] }>()

const { open } = useDialog()

function save(feat: CharacterFeat) {
    const exists = props.feats.some(item => item.id === feat.id)
    emit(
        'update',
        exists
            ? props.feats.map(item => (item.id === feat.id ? feat : item))
            : [...props.feats, feat],
    )
}
function openEditor(feat: CharacterFeat) {
    open({
        component: CharacterFeatEditorModal,
        componentProps: {
            feat: { ...feat },
            disabled: props.disabled,
            onSave: save,
        },
    })
}
function add() {
    openEditor({ id: `feat-${Date.now()}`, name: '', description: '' })
}
function remove(id: string, name: string) {
    openConfirmModal({
        text: `удалить черту «${name || 'без названия'}»?`,
        onOk: () =>
            emit(
                'update',
                props.feats.filter(feat => feat.id !== id),
            ),
    })
}
</script>

<template>
    <section class="sheet-section feats-section">
        <div class="section-heading">
            <div>
                <h2>Черты персонажа</h2>
                <p class="section-note">
                    Пользовательские записи без автоматического применения эффектов.
                </p>
            </div>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="feats.length === 0" text="Черты пока не добавлены." />
        <div v-for="feat in feats" :key="feat.id" class="entry-card feat-entry-card">
            <div class="feat-entry-content">
                <h3 :title="feat.name || 'Без названия'">
                    {{ feat.name || 'Без названия' }}
                </h3>
            </div>
            <EntryActions
                :disabled="disabled"
                @edit="openEditor(feat)"
                @remove="remove(feat.id, feat.name)"
            />
        </div>
    </section>
</template>
