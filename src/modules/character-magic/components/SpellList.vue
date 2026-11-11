<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import { searchFilterObject } from '@/composables/useFilters'
import SpellEditorModal from './SpellEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import CollectionSearch from '@/modules/character-inventory/components/CollectionSearch.vue'
import type { CharacterSpell } from '@/types/character'
import { RULES_2024_CLASSES, getRules2024Spell } from '@/data/rules2024/index.ts'

const props = defineProps<{
    title: string
    spells: CharacterSpell[]
    cantrip?: boolean
    preparedIds?: string[]
    showPreparedFilter?: boolean
    disabled?: boolean
}>()

const emit = defineEmits<{
    update: [spells: CharacterSpell[]]
    'update:prepared-ids': [ids: string[]]
}>()

const query = ref('')

const preparedOnly = ref(false)

type EditorModalProps = {
    cantrip?: boolean
    disabled?: boolean
    onSave: (spell: CharacterSpell) => void
}

type ConfirmModalProps = {
    text: string
    onOk: () => void | Promise<void>
}

const editorModal = useModalUtil<CharacterSpell, EditorModalProps>()

const confirmModal = useModalUtil<undefined, ConfirmModalProps>()

const classLabels = new Map(RULES_2024_CLASSES.map(item => [item.id, item.label]))

function catalogSpell(spell: CharacterSpell) {
    return getRules2024Spell(spell.id)
}

function schoolLabel(spell: CharacterSpell): string {
    return spell.school || catalogSpell(spell)?.school || ''
}

function classLabel(spell: CharacterSpell): string {
    const classes = spell.classes ?? catalogSpell(spell)?.classes ?? []
    return classes.map(id => classLabels.get(id) ?? id).join(' · ')
}

function metadataLabel(spell: CharacterSpell): string {
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

function save(spell: CharacterSpell) {
    const exists = props.spells.some(item => item.id === spell.id)
    emit(
        'update',
        exists
            ? props.spells.map(item => (item.id === spell.id ? spell : item))
            : [...props.spells, spell],
    )
}
function openEditor(spell: CharacterSpell) {
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
    })
}
function remove(id: string, name: string) {
    confirmModal.props.value = {
        text: `удалить запись «${name || 'без названия'}»?`,
        onOk: () =>
            emit(
                'update',
                props.spells.filter(item => item.id !== id),
            ),
    }
    confirmModal.openOrClose()
}
function togglePrepared(id: string, checked: boolean) {
    const prepared = new Set(props.preparedIds ?? [])
    if (checked) prepared.add(id)
    else prepared.delete(id)
    emit('update:prepared-ids', [...prepared])
}
</script>

<template>
    <section class="c-sheet-section spellbook-section">
        <div class="c-section-heading">
            <h2>{{ title }}</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <CollectionSearch v-model:query="query" :label="`Поиск: ${title.toLowerCase()}`" />
        <label v-if="showPreparedFilter" class="prepared-filter"
            ><NCheckbox v-model:checked="preparedOnly" :disabled="disabled"
                >Только подготовленные</NCheckbox
            ></label
        >
        <EmptyCollection v-if="spells.length === 0" :text="`${title} пока нет.`" />
        <EmptyCollection v-else-if="visibleSpells.length === 0" text="Совпадений не найдено." />
        <div v-for="spell in visibleSpells" :key="spell.id" class="c-entry-card spell-entry-card">
            <div class="spell-entry-content">
                <div class="spell-title">
                    <div>
                        <h3>{{ spell.name || 'Без названия' }}</h3>
                        <span class="spell-kind-badge">{{
                            cantrip ? 'Заговор' : `Уровень ${spell.level}`
                        }}</span>
                    </div>
                    <label v-if="showPreparedFilter" class="prepared-toggle"
                        ><NCheckbox
                            :checked="(preparedIds ?? []).includes(spell.id)"
                            :disabled="disabled"
                            @update:checked="togglePrepared(spell.id, $event)"
                            >Подготовлено</NCheckbox
                        ></label
                    >
                </div>
                <div class="spell-meta-line">
                    <span v-if="schoolLabel(spell)">Школа: {{ schoolLabel(spell) }}</span
                    ><span v-if="classLabel(spell)">Классы: {{ classLabel(spell) }}</span
                    ><span v-if="metadataLabel(spell)">{{ metadataLabel(spell) }}</span>
                </div>
                <p
                    v-if="spell.description"
                    class="spell-description-preview"
                    :title="spell.description"
                >
                    {{ spell.description }}
                </p>
            </div>
            <EntryActions
                :disabled="disabled"
                @edit="openEditor(spell)"
                @remove="remove(spell.id, spell.name)"
            />
        </div>
        <SpellEditorModal
            v-if="
                editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
            "
            :spell="editorModal.item.value"
            v-bind="editorModal.props.value"
            @close="editorModal.openOrClose"
        />
        <ConfirmModal
            v-if="confirmModal.isShowModal.value && confirmModal.props.value"
            v-bind="confirmModal.props.value"
            @close="confirmModal.openOrClose"
        />
    </section>
</template>

<style scoped>
.spell-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
.prepared-filter,
.prepared-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--sheet-muted);
    font-size: 0.8rem;
}
.prepared-filter {
    margin: -6px 0 14px;
}
.prepared-filter :deep(input),
.prepared-toggle :deep(input) {
    accent-color: var(--sheet-gold);
}
.spell-kind-badge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 3px 7px;
    border: 1px solid #d7c39f;
    border-radius: 999px;
    background: #fbf0d8;
    color: #805921;
    font-size: 0.65rem;
    font-weight: 800;
}
.spell-title h3 {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.spellbook-section .c-section-heading {
    margin-bottom: 14px;
}
.spell-entry-card {
    margin-top: 3px;
    padding: 14px 0 15px;
}
.spell-entry-card:hover {
    margin-inline: -8px;
    padding-inline: 8px;
    border-radius: 10px;
    background: rgba(255, 248, 231, 0.55);
}
.spell-entry-content {
    min-width: 0;
    flex: 1;
}
.spell-title > div:first-child {
    min-width: 0;
}
.spell-title h3 {
    display: block;
    max-width: 100%;
}
.spell-kind-badge {
    margin-top: 5px;
    border-color: #d7c39f;
    background: #fbf0d8;
    color: #805921;
}
.spell-entry-card p {
    max-width: 72ch;
}
.spell-description-preview {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}
.spell-meta-line {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin-top: 7px;
    color: var(--sheet-muted);
    font-size: 0.74rem;
}
.spell-meta-line span {
    display: inline-flex;
    align-items: center;
}
@media (max-width: 560px) {
    .spell-entry-card:hover {
        margin-inline: 0;
        padding-inline: 0;
        background: transparent;
    }
}
@media (prefers-reduced-motion: reduce) {
    .spell-entry-card {
        transition: none;
    }
}
.spell-entry-card {
    border-color: #dec9a4;
}
.spell-entry-card:hover {
    background: rgba(255, 246, 221, 0.62);
}
.spell-kind-badge {
    border-color: #d2b989;
}
@media print {
    .spell-entry-card {
        border-color: #aaa;
    }
}
</style>
