<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCheckbox } from 'naive-ui'

import CEntryActions from '@/components/CEntryActions.vue'
import CSearch from '@/components/CSearch.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { searchFilterObject } from '@/composables/useFilters'
import { useModalUtil } from '@/composables/useModal'
import type { CharacterKnownSpellRecord } from '@/types/character'
import { getEntryKey } from '@/utils/getEntryKey'
import SpellEditorModal, { type Props as EditorModalProps } from './SpellEditorModal.vue'

const { character } = useCharacterSheet()

const query = ref('')

const preparedOnly = ref(false)

const editorModal = useModalUtil<undefined, EditorModalProps>()

const visibleSpells = computed(() => {
    const matches = searchFilterObject(
        character.value?.spellcasting.knownSpells ?? [],
        ['name', 'description'],
        query.value,
    )
    return preparedOnly.value ? matches.filter(spell => spell.prepared) : matches
})

function openEditor(spell?: CharacterKnownSpellRecord) {
    editorModal.props.value = {
        spell,
        onSave: updatedSpell => {
            if (spell) Object.assign(spell, updatedSpell)
            else character.value?.spellcasting.knownSpells.push(updatedSpell)
        },
    }
    editorModal.openOrClose()
}

function remove(spell: CharacterKnownSpellRecord) {
    if (!character.value) return
    character.value.spellcasting.knownSpells = character.value.spellcasting.knownSpells.filter(
        current => current !== spell,
    )
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3>Заклинания</h3>
            <NButton @click="openEditor()">Добавить</NButton>
        </div>
        <CSearch v-model:query="query" label="Поиск" />
        <NCheckbox v-model:checked="preparedOnly">Только подготовленные</NCheckbox>
        <div v-for="spell in visibleSpells" :key="getEntryKey(spell)" class="py-3">
            <h3>{{ spell.name || 'Без названия' }}</h3>
            <span>Уровень {{ spell.level }}</span>
            <NCheckbox v-model:checked="spell.prepared">Подготовлено</NCheckbox>
            <p v-if="spell.school">Школа: {{ spell.school }}</p>
            <p v-if="spell.description" :title="spell.description">
                {{ spell.description }}
            </p>
            <CEntryActions @edit="openEditor(spell)" @remove="remove(spell)" />
        </div>
        <SpellEditorModal v-if="editorModal.isShowModal.value && editorModal.props.value"
            v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
