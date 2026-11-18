<script setup lang="ts">
import { NButton } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { useModalUtil } from '@/composables/useModal'
import CharacterFeatEditorModal, {
    type Props as EditorModalProps,
} from './CharacterFeatEditorModal.vue'
import CEntryActions from '@/components/CEntryActions.vue'
import type { CharacterFeat } from '@/types/character'
import { getEntryKey } from '@/utils/getEntryKey'

const { character } = useCharacterSheet()

const editorModal = useModalUtil<undefined, EditorModalProps>()

function openEditor(feat: CharacterFeat) {
    editorModal.props.value = {
        feat,
        onSave: updatedFeat => {
            if (!character.value) return
            character.value.feats ??= []
            if (character.value.feats.includes(feat)) Object.assign(feat, updatedFeat)
            else character.value.feats.push(updatedFeat)
        },
    }
    editorModal.openOrClose()
}
function add() {
    openEditor({ name: '', description: '' })
}
function remove(feat: CharacterFeat) {
    if (!character.value) return
    character.value.feats = character.value.feats?.filter(current => current !== feat) ?? []
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3>Черты персонажа</h3>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <div v-for="feat in character.feats" :key="getEntryKey(feat)"
            class="py-3 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
                <h3 :title="feat.name || 'Без названия'">
                    {{ feat.name || 'Без названия' }}
                </h3>
            </div>
            <CEntryActions @edit="openEditor(feat)" @remove="remove(feat)" />
        </div>
        <CharacterFeatEditorModal v-if="editorModal.isShowModal.value && editorModal.props.value"
            v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
