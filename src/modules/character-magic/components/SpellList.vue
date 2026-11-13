<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import { searchFilterObject } from '@/composables/useFilters'
import SpellEditorModal from './SpellEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import CollectionSearch from '@/modules/character-inventory/components/CollectionSearch.vue'
import type { CharacterSpellRecord } from '@/types/character'
import { RULES_2024_CLASSES, getRules2024Spell } from '@/data/rules2024/index.ts'

type Emits = {
    update: [spells: CharacterSpellRecord[]]
    'update:prepared-ids': [ids: string[]]
}

const props = defineProps<{
    title: string
    spells: CharacterSpellRecord[]
    cantrip?: boolean
    preparedIds?: string[]
    showPreparedFilter?: boolean
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const query = ref('')

const preparedOnly = ref(false)

type EditorModalProps = {
    cantrip?: boolean
    disabled?: boolean
    onSave: (spell: CharacterSpellRecord) => void
}

const editorModal = useModalUtil<CharacterSpellRecord, EditorModalProps>()

const classLabels = new Map(RULES_2024_CLASSES.map(item => [item.id, item.label]))

function catalogSpell(spell: CharacterSpellRecord) {
    return getRules2024Spell(spell.id)
}

function schoolLabel(spell: CharacterSpellRecord): string {
    return spell.school || catalogSpell(spell)?.school || ''
}

function classLabel(spell: CharacterSpellRecord): string {
    const classes = spell.classes ?? catalogSpell(spell)?.classes ?? []
    return classes.map(id => classLabels.get(id) ?? id).join(' · ')
}

function metadataLabel(spell: CharacterSpellRecord): string {
    const metadata = spell.metadata ?? catalogSpell(spell)?.metadata
    if (!metadata) return ''
    return Object.entries(metadata)
        .filter(([key]) => key !== 'referenceOnly')
        .map(
            ([key, value]) =>
                `${key === 'source' ? 'Источник' : key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`,
        )
        .join(' · ')
}

const visibleSpells = computed(() => {
    const search = query.value.trim()

    const matches = search
        ? searchFilterObject(props.spells, ['name', 'description'], search)
        : props.spells
    return props.spells.filter(
        spell =>
            matches.includes(spell) &&
            (!preparedOnly.value || (props.preparedIds ?? []).includes(spell.id)),
    )
})

function save(spell: CharacterSpellRecord) {
    const exists = props.spells.some(item => item.id === spell.id)
    emit(
        'update',
        exists
            ? props.spells.map(item => (item.id === spell.id ? spell : item))
            : [...props.spells, spell],
    )
}
function openEditor(spell: CharacterSpellRecord) {
    editorModal.item.value = { ...spell }
    editorModal.props.value = {
        cantrip: props.cantrip,
        disabled: props.disabled,
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
    emit(
        'update',
        props.spells.filter(spell => spell.id !== id),
    )
}
function togglePrepared(id: string, checked: boolean) {
    const prepared = new Set(props.preparedIds ?? [])
    if (checked) prepared.add(id)
    else prepared.delete(id)
    emit('update:prepared-ids', [...prepared])
}
</script>

<template>
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>{{ title }}</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <CollectionSearch v-model:query="query" :label="`Поиск: ${title.toLowerCase()}`" />
        <label v-if="showPreparedFilter">
            <NCheckbox v-model:checked="preparedOnly" :disabled="disabled">Только подготовленные</NCheckbox>
        </label>
        <EmptyCollection v-if="spells.length === 0" :text="`${title} пока нет.`" />
        <EmptyCollection v-else-if="visibleSpells.length === 0" text="Совпадений не найдено." />
        <div v-for="spell in visibleSpells" :key="spell.id" class="py-3">
            <div>
                <div>
                    <div>
                        <h3>{{ spell.name || 'Без названия' }}</h3>
                        <span>{{ cantrip ? 'Заговор' : `Уровень ${spell.level}` }}</span>
                    </div>
                    <label v-if="showPreparedFilter">
                        <NCheckbox :checked="(preparedIds ?? []).includes(spell.id)" :disabled="disabled"
                            @update:checked="togglePrepared(spell.id, $event)">Подготовлено</NCheckbox>
                    </label>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span v-if="schoolLabel(spell)">Школа: {{ schoolLabel(spell) }}</span><span
                        v-if="classLabel(spell)">Классы: {{ classLabel(spell) }}</span><span
                        v-if="metadataLabel(spell)">{{ metadataLabel(spell) }}</span>
                </div>
                <p v-if="spell.description" :title="spell.description">
                    {{ spell.description }}
                </p>
            </div>
            <EntryActions :disabled="disabled" @edit="openEditor(spell)" @remove="remove(spell.id)" />
        </div>
        <SpellEditorModal v-if="
            editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
        " :spell="editorModal.item.value" v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
