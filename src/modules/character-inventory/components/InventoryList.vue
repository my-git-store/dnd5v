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

const props = defineProps<{ items: CharacterInventoryItemRecord[]; disabled?: boolean }>()

const emit = defineEmits<{
    update: [items: CharacterInventoryItemRecord[]]
    'use-item': [id: string]
}>()

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
    <section class="sheet-section inventory-ledger-section">
        <div class="section-heading">
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
        <div v-for="item in visibleItems" :key="item.id" class="entry-card inventory-entry-card">
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
                    <span v-if="item.equipped" class="mode-tag mode-equipped">Экипировано</span>
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
            v-if="editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value"
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
