<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton } from 'naive-ui'

import CEntryActions from '@/components/CEntryActions.vue'
import CSearch from '@/components/CSearch.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { searchFilterObject } from '@/composables/useFilters'
import { useModalUtil } from '@/composables/useModal'
import type { CharacterSpellRecord } from '@/types/character'
import { getEntryKey } from '@/utils/getEntryKey'
import CantripEditorModal, { type Props as EditorModalProps } from './CantripEditorModal.vue'

const { character } = useCharacterSheet()

const query = ref('')

const editorModal = useModalUtil<undefined, EditorModalProps>()

const visibleCantrips = computed(() =>
    searchFilterObject(
        character.value?.spellcasting.cantrips ?? [],
        ['name', 'description'],
        query.value,
    ),
)

function openEditor(cantrip?: CharacterSpellRecord) {
    editorModal.props.value = {
        cantrip,
        onSave: updatedCantrip => {
            if (cantrip) Object.assign(cantrip, updatedCantrip)
            else character.value?.spellcasting.cantrips.push(updatedCantrip)
        },
    }
    editorModal.openOrClose()
}

function remove(cantrip: CharacterSpellRecord) {
    if (!character.value) return
    character.value.spellcasting.cantrips = character.value.spellcasting.cantrips.filter(
        current => current !== cantrip,
    )
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3>Заговоры</h3>
            <NButton @click="openEditor()">Добавить</NButton>
        </div>
        <CSearch v-model:query="query" label="Поиск" />
        <div v-for="cantrip in visibleCantrips" :key="getEntryKey(cantrip)" class="py-3">
            <h3>{{ cantrip.name || 'Без названия' }}</h3>
            <span>Заговор</span>
            <p v-if="cantrip.school">Школа: {{ cantrip.school }}</p>
            <p v-if="cantrip.description" :title="cantrip.description">
                {{ cantrip.description }}
            </p>
            <CEntryActions @edit="openEditor(cantrip)" @remove="remove(cantrip)" />
        </div>
        <CantripEditorModal v-if="editorModal.isShowModal.value && editorModal.props.value"
            v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
