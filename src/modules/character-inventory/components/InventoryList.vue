<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import { searchFilterObject } from '@/composables/useFilters'
import InventoryItemEditorModal from './InventoryItemEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import CollectionSearch from '@/modules/character-inventory/components/CollectionSearch.vue'
import type { CharacterInventoryItemRecord } from '@/types/character'
import { getRules2024Weapon } from '@/data/rules2024/index.ts'

type Emits = {
    update: [items: CharacterInventoryItemRecord[]]
    'use-item': [id: string]
}

const props = defineProps<{ items: CharacterInventoryItemRecord[]; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const query = ref('')

const showEquipped = ref(true)

const showUnequipped = ref(true)

type EditorModalProps = {
    disabled?: boolean
    onSave: (item: CharacterInventoryItemRecord) => void
}

type ConfirmModalProps = {
    text: string
    onOk: () => void | Promise<void>
}

const editorModal = useModalUtil<CharacterInventoryItemRecord, EditorModalProps>()

const confirmModal = useModalUtil<undefined, ConfirmModalProps>()

const visibleItems = computed(() => {
    const search = query.value.trim()

    const matches = search
        ? searchFilterObject(props.items, ['name', 'description', 'properties'], search)
        : props.items
    return props.items.filter(item => {
        const matchesSearch = matches.includes(item)

        const matchesEquipmentFilter = item.equipped ? showEquipped.value : showUnequipped.value
        return matchesSearch && matchesEquipmentFilter
    })
})

function save(item: CharacterInventoryItemRecord) {
    const exists = props.items.some(current => current.id === item.id)
    emit(
        'update',
        exists
            ? props.items.map(current => (current.id === item.id ? item : current))
            : [...props.items, item],
    )
}
function openEditor(item: CharacterInventoryItemRecord) {
    editorModal.item.value = { ...item, properties: [...item.properties] }
    editorModal.props.value = { disabled: props.disabled, onSave: save }
    editorModal.openOrClose()
}
function add() {
    openEditor({
        id: `item-${Date.now()}`,
        name: '',
        quantity: 1,
        weight: null,
        description: '',
        equipped: false,
        properties: [],
    })
}
function remove(id: string, name: string) {
    confirmModal.props.value = {
        text: `удалить предмет «${name || 'без названия'}»?`,
        onOk: () =>
            emit(
                'update',
                props.items.filter(item => item.id !== id),
            ),
    }
    confirmModal.openOrClose()
}
function isConsumable(item: CharacterInventoryItemRecord): boolean {
    return item.properties.some(property => /расход|однораз|consumable/i.test(property))
}
function changeQuantity(item: CharacterInventoryItemRecord, delta: number) {
    emit(
        'update',
        props.items.map(current =>
            current.id === item.id
                ? { ...current, quantity: Math.max(0, current.quantity + delta) }
                : current,
        ),
    )
}
</script>

<template>
    <section class="c-sheet-section inventory-ledger-section">
        <div class="c-section-heading">
            <h2>Предметы</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <CollectionSearch v-model:query="query" label="Поиск по инвентарю" />
        <fieldset class="inventory-filter" :disabled="disabled">
            <legend>Показывать</legend>
            <label
                ><NCheckbox v-model:checked="showEquipped" :disabled="disabled"
                    >Экипированные</NCheckbox
                ></label
            >
            <label
                ><NCheckbox v-model:checked="showUnequipped" :disabled="disabled"
                    >Не экипированные</NCheckbox
                ></label
            >
        </fieldset>
        <EmptyCollection v-if="items.length === 0" text="Инвентарь пока пуст." />
        <EmptyCollection v-else-if="visibleItems.length === 0" text="Совпадений не найдено." />
        <div v-for="item in visibleItems" :key="item.id" class="c-entry-card inventory-entry-card">
            <div class="inventory-entry-content">
                <div class="inventory-title">
                    <div>
                        <h3>{{ item.name || 'Без названия' }}</h3>
                        <span v-if="item.source === 'creation'" class="inventory-source-badge"
                            >Стартовый набор</span
                        ><span
                            v-if="item.weaponId && getRules2024Weapon(item.weaponId)"
                            class="inventory-source-badge"
                            >Оружие: {{ getRules2024Weapon(item.weaponId)?.name }}</span
                        >
                    </div>
                    <span v-if="item.equipped" class="c-mode-tag mode-equipped">Экипировано</span>
                </div>
                <div class="inventory-facts">
                    <span class="inventory-quantity-control"
                        ><span>Количество: {{ item.quantity }}</span
                        ><button
                            type="button"
                            :disabled="disabled || item.quantity <= 0"
                            aria-label="Уменьшить количество"
                            @click="changeQuantity(item, -1)"
                        >
                            −</button
                        ><button
                            type="button"
                            :disabled="disabled"
                            aria-label="Увеличить количество"
                            @click="changeQuantity(item, 1)"
                        >
                            +
                        </button></span
                    ><span v-if="item.weight !== null">Вес: {{ item.weight }}</span>
                </div>
                <p v-if="item.properties.length" class="inventory-meta">
                    {{ item.properties.join(' · ') }}
                </p>
                <details v-if="item.description" class="inventory-description">
                    <summary>{{ item.description }}</summary>
                    <p>{{ item.description }}</p>
                </details>
            </div>
            <div class="inventory-entry-actions">
                <NButton
                    v-if="isConsumable(item)"
                    :disabled="disabled || item.quantity <= 0"
                    @click="emit('use-item', item.id)"
                    >Использовать</NButton
                >
                <EntryActions
                    :disabled="disabled"
                    @edit="openEditor(item)"
                    @remove="remove(item.id, item.name)"
                />
            </div>
        </div>
        <InventoryItemEditorModal
            v-if="
                editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
            "
            :item="editorModal.item.value"
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
.inventory-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
.inventory-meta {
    font-size: 0.78rem !important;
}
.inventory-description {
    max-width: 72ch;
    margin-top: 7px;
    color: var(--sheet-muted);
    font-size: 0.9rem;
    line-height: 1.5;
}
.inventory-description summary {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
}
.inventory-description summary::marker {
    color: var(--sheet-gold);
}
.inventory-description p {
    margin-top: 7px;
    white-space: pre-wrap;
}
.inventory-source-badge {
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
.inventory-title h3 {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.inventory-entry-actions {
    display: grid;
    align-content: center;
    justify-items: end;
    gap: 8px;
    flex: 0 0 auto;
}
.inventory-quantity-control {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.inventory-quantity-control button {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 6px;
    background: #fff5de;
    color: var(--sheet-ink);
    cursor: pointer;
}
.inventory-quantity-control button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.inventory-entry-card {
    margin-top: 3px;
    padding: 14px 0 15px;
}
.inventory-entry-card:hover {
    margin-inline: -8px;
    padding-inline: 8px;
    border-radius: 10px;
    background: rgba(255, 248, 231, 0.55);
}
.inventory-entry-content {
    min-width: 0;
    flex: 1;
}
.inventory-title > div:first-child {
    min-width: 0;
}
.inventory-title h3 {
    display: block;
    max-width: 100%;
}
.inventory-source-badge {
    margin-top: 5px;
    border-color: #d7c39f;
    background: #fbf0d8;
    color: #805921;
}
.inventory-entry-card p {
    max-width: 72ch;
}
.inventory-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin: 0 0 12px;
    padding: 8px 10px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 8px;
    color: var(--sheet-muted);
    font-size: 0.8rem;
}
.inventory-filter legend {
    margin-inline: 4px;
    padding-inline: 5px;
    color: var(--sheet-faded);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.inventory-filter :deep(label) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}
.inventory-filter :deep(input) {
    accent-color: var(--sheet-gold);
}
.inventory-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}
.inventory-facts span {
    padding: 4px 8px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 7px;
    background: rgba(255, 248, 231, 0.76);
    color: var(--sheet-muted);
    font-size: 0.74rem;
}
.inventory-ledger-section :deep(.collection-search) {
    margin-bottom: 12px;
}
.inventory-ledger-section :deep(.c-entry-actions) {
    align-self: center;
}
.inventory-ledger-section > .c-section-heading {
    margin-bottom: 16px;
    padding-bottom: 8px;
}
.inventory-entry-card {
    border-color: #dec9a4;
}
.inventory-entry-card:hover {
    background: rgba(255, 246, 221, 0.62);
}
.inventory-source-badge {
    border-color: #d2b989;
}
</style>
