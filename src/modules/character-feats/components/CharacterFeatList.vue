<script setup lang="ts">
import { NButton } from 'naive-ui'

import { useModalUtil } from '@/composables/useModal'
import CharacterFeatEditorModal, {
    type Props as EditorModalProps,
} from './CharacterFeatEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterFeat } from '@/types/character'

type Emits = {
    update: [feats: CharacterFeat[]]
}

const props = defineProps<{ feats: CharacterFeat[]; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const editorModal = useModalUtil<undefined, EditorModalProps>()

function save(feat: CharacterFeat) {
    const exists = props.feats.some(current => current.id === feat.id)
    emit(
        'update',
        exists
            ? props.feats.map(current => (current.id === feat.id ? feat : current))
            : [...props.feats, feat],
    )
}
function openEditor(feat: CharacterFeat) {
    editorModal.props.value = { feat, onSave: save }
    editorModal.openOrClose()
}
function add() {
    openEditor({ id: `feat-${Date.now()}`, name: '', description: '' })
}
function remove(id: string) {
    emit(
        'update',
        props.feats.filter(feat => feat.id !== id),
    )
}
</script>

<template>
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Черты персонажа</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="feats.length === 0" text="Черты пока не добавлены." />
        <div v-for="feat in feats" :key="feat.id" class="py-3 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
                <h3 :title="feat.name || 'Без названия'">
                    {{ feat.name || 'Без названия' }}
                </h3>
            </div>
            <EntryActions :disabled="disabled" @edit="openEditor(feat)" @remove="remove(feat.id)" />
        </div>
        <CharacterFeatEditorModal
            v-if="editorModal.isShowModal.value && editorModal.props.value"
            v-bind="editorModal.props.value"
            :disabled="disabled"
            @close="editorModal.openOrClose"
        />
    </section>
</template>
