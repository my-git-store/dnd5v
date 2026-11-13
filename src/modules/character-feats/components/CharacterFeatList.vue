<script setup lang="ts">
import { NButton } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { useModalUtil } from '@/composables/useModal'
import CharacterFeatEditorModal, {
    type Props as EditorModalProps,
} from './CharacterFeatEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterFeat } from '@/types/character'

const { character } = useCharacterSheet()

const editorModal = useModalUtil<undefined, EditorModalProps>()

function save(feat: CharacterFeat) {
    if (!character.value) return
    character.value.feats ??= []
    const index = character.value.feats.findIndex(current => current.id === feat.id)
    if (index === -1) character.value.feats.push(feat)
    else character.value.feats[index] = feat
}
function openEditor(feat: CharacterFeat) {
    editorModal.props.value = { feat, onSave: save }
    editorModal.openOrClose()
}
function add() {
    openEditor({ id: `feat-${Date.now()}`, name: '', description: '' })
}
function remove(id: string) {
    if (!character.value) return
    character.value.feats = character.value.feats?.filter(feat => feat.id !== id) ?? []
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Черты персонажа</h2>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="!character.feats?.length" text="Черты пока не добавлены." />
        <div v-for="feat in character.feats" :key="feat.id" class="py-3 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
                <h3 :title="feat.name || 'Без названия'">
                    {{ feat.name || 'Без названия' }}
                </h3>
            </div>
            <EntryActions @edit="openEditor(feat)" @remove="remove(feat.id)" />
        </div>
        <CharacterFeatEditorModal
            v-if="editorModal.isShowModal.value && editorModal.props.value"
            v-bind="editorModal.props.value"
            @close="editorModal.openOrClose"
        />
    </section>
</template>
