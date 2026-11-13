<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCheckbox } from 'naive-ui'
import { useModalUtil } from '@/composables/useModal'
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

const editorModal = useModalUtil<CharacterInventoryItemRecord, EditorModalProps>()

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
function remove(id: string) {
    emit(
        'update',
        props.items.filter(item => item.id !== id),
    )
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
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Предметы</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <CollectionSearch v-model:query="query" label="Поиск по инвентарю" />
        <fieldset class="flex flex-wrap items-center gap-2" :disabled="disabled">
            <legend>Показывать</legend>
            <label>
                <NCheckbox v-model:checked="showEquipped" :disabled="disabled">Экипированные</NCheckbox>
            </label>
            <label>
                <NCheckbox v-model:checked="showUnequipped" :disabled="disabled">Не экипированные</NCheckbox>
            </label>
        </fieldset>
        <EmptyCollection v-if="items.length === 0" text="Инвентарь пока пуст." />
        <EmptyCollection v-else-if="visibleItems.length === 0" text="Совпадений не найдено." />
        <div v-for="item in visibleItems" :key="item.id" class="py-3 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
                <div>
                    <div>
                        <h3>{{ item.name || 'Без названия' }}</h3>
                        <span v-if="item.source === 'creation'">Стартовый набор</span><span
                            v-if="item.weaponId && getRules2024Weapon(item.weaponId)">Оружие: {{
                                getRules2024Weapon(item.weaponId)?.name }}</span>
                    </div>
                    <span v-if="item.equipped">Экипировано</span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span class="flex flex-wrap items-center gap-2"><span>Количество: {{ item.quantity }}</span>
                        <NButton native-type="button" :disabled="disabled || item.quantity <= 0"
                            aria-label="Уменьшить количество" @click="changeQuantity(item, -1)">
                            −</NButton>
                        <NButton native-type="button" :disabled="disabled" aria-label="Увеличить количество"
                            @click="changeQuantity(item, 1)">
                            +
                        </NButton>
                    </span><span v-if="item.weight !== null">Вес: {{ item.weight }}</span>
                </div>
                <p v-if="item.properties.length">
                    {{ item.properties.join(' · ') }}
                </p>
                <details v-if="item.description">
                    <summary>{{ item.description }}</summary>
                    <p>{{ item.description }}</p>
                </details>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <NButton v-if="isConsumable(item)" :disabled="disabled || item.quantity <= 0"
                    @click="emit('use-item', item.id)">Использовать</NButton>
                <EntryActions :disabled="disabled" @edit="openEditor(item)" @remove="remove(item.id)" />
            </div>
        </div>
        <InventoryItemEditorModal v-if="
            editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
        " :item="editorModal.item.value" v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
