<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCheckbox } from 'naive-ui'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { useModalUtil } from '@/composables/useModal'
import { searchFilterObject } from '@/composables/useFilters'
import SpellEditorModal from './SpellEditorModal.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import CollectionSearch from '@/modules/character-inventory/components/CollectionSearch.vue'
import type { CharacterSpellRecord } from '@/types/character'

const props = defineProps<{
    title: string
    cantrip?: boolean
    showPreparedFilter?: boolean
}>()

const { character } = useCharacterSheet()

const spells = computed(() => {
    if (!character.value) return []
    return props.cantrip
        ? character.value.spellcasting.cantrips
        : character.value.spellcasting.knownSpells
})

const query = ref('')

const preparedOnly = ref(false)

type EditorModalProps = {
    cantrip?: boolean
    onSave: (spell: CharacterSpellRecord) => void
}

const editorModal = useModalUtil<CharacterSpellRecord, EditorModalProps>()

const visibleSpells = computed(() => {
    const search = query.value.trim()

    const matches = search
        ? searchFilterObject(spells.value, ['name', 'description'], search)
        : spells.value
    return spells.value.filter(
        spell =>
            matches.includes(spell) &&
            (!preparedOnly.value || character.value?.spellcasting.preparedSpellIds.includes(spell.id)),
    )
})

function save(spell: CharacterSpellRecord) {
    if (!character.value) return
    const index = spells.value.findIndex(current => current.id === spell.id)
    if (index === -1) spells.value.push(spell)
    else spells.value[index] = spell
}
function openEditor(spell: CharacterSpellRecord) {
    editorModal.item.value = { ...spell }
    editorModal.props.value = {
        cantrip: props.cantrip,
        onSave: save,
    }
    editorModal.openOrClose()
}
function add() {
    openEditor({
        id: `${props.cantrip ? 'cantrip' : 'spell'}-${Date.now()}`,
        name: '',
        level: props.cantrip ? 0 : 1,
        description: '',
        school: '',
        castingTime: '',
        range: '',
        components: '',
        duration: '',
        concentration: false,
        ritual: false,
    })
}
function remove(id: string) {
    if (!character.value) return
    const index = spells.value.findIndex(spell => spell.id === id)
    if (index === -1) return
    spells.value.splice(index, 1)
    if (!props.cantrip) {
        character.value.spellcasting.preparedSpellIds =
            character.value.spellcasting.preparedSpellIds.filter(preparedId => preparedId !== id)
    }
}
function togglePrepared(id: string, checked: boolean) {
    if (!character.value) return
    const prepared = new Set(character.value.spellcasting.preparedSpellIds)
    if (checked) prepared.add(id)
    else prepared.delete(id)
    character.value.spellcasting.preparedSpellIds = [...prepared]
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>{{ title }}</h2>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <CollectionSearch v-model:query="query" :label="`Поиск: ${title.toLowerCase()}`" />
        <label v-if="showPreparedFilter">
            <NCheckbox v-model:checked="preparedOnly">Только подготовленные</NCheckbox>
        </label>
        <div v-for="spell in visibleSpells" :key="spell.id" class="py-3">
            <div>
                <div>
                    <div>
                        <h3>{{ spell.name || 'Без названия' }}</h3>
                        <span>{{ cantrip ? 'Заговор' : `Уровень ${spell.level}` }}</span>
                    </div>
                    <label v-if="showPreparedFilter">
                        <NCheckbox :checked="character.spellcasting.preparedSpellIds.includes(spell.id)"
                            @update:checked="togglePrepared(spell.id, $event)">Подготовлено</NCheckbox>
                    </label>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span v-if="spell.school">Школа: {{ spell.school }}</span>
                </div>
                <p v-if="spell.description" :title="spell.description">
                    {{ spell.description }}
                </p>
            </div>
            <EntryActions @edit="openEditor(spell)" @remove="remove(spell.id)" />
        </div>
        <SpellEditorModal v-if="
            editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
        " :spell="editorModal.item.value" v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
