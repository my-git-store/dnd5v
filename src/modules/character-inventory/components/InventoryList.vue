<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCheckbox } from 'naive-ui'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { useModalUtil } from '@/composables/useModal'
import { searchFilterObject } from '@/composables/useFilters'
import InventoryItemEditorModal from './InventoryItemEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import CollectionSearch from '@/modules/character-inventory/components/CollectionSearch.vue'
import type { CharacterInventoryItemRecord } from '@/types/character'
import { getRules2024Weapon } from '@/data/rules2024/index.ts'

const { character } = useCharacterSheet()

const query = ref('')

const showEquipped = ref(true)

const showUnequipped = ref(true)

type EditorModalProps = {
    onSave: (item: CharacterInventoryItemRecord) => void
}

const editorModal = useModalUtil<CharacterInventoryItemRecord, EditorModalProps>()

const visibleItems = computed(() => {
    const items = character.value?.inventory.items ?? []

    const search = query.value.trim()

    const matches = search
        ? searchFilterObject(items, ['name', 'description', 'properties'], search)
        : items
    return items.filter(item => {
        const matchesSearch = matches.includes(item)

        const matchesEquipmentFilter = item.equipped ? showEquipped.value : showUnequipped.value
        return matchesSearch && matchesEquipmentFilter
    })
})

function save(item: CharacterInventoryItemRecord) {
    if (!character.value) return
    const index = character.value.inventory.items.findIndex(current => current.id === item.id)
    if (index === -1) character.value.inventory.items.push(item)
    else character.value.inventory.items[index] = item
}
function openEditor(item: CharacterInventoryItemRecord) {
    editorModal.item.value = { ...item, properties: [...item.properties] }
    editorModal.props.value = { onSave: save }
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
    if (!character.value) return
    character.value.inventory.items = character.value.inventory.items.filter(item => item.id !== id)
}
function isConsumable(item: CharacterInventoryItemRecord): boolean {
    return item.properties.some(property => /расход|однораз|consumable/i.test(property))
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Предметы</h2>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <CollectionSearch v-model:query="query" label="Поиск по инвентарю" />
        <fieldset class="flex flex-wrap items-center gap-2">
            <legend>Показывать</legend>
            <label>
                <NCheckbox v-model:checked="showEquipped">Экипированные</NCheckbox>
            </label>
            <label>
                <NCheckbox v-model:checked="showUnequipped">Не экипированные</NCheckbox>
            </label>
        </fieldset>
        <EmptyCollection v-if="character.inventory.items.length === 0" text="Инвентарь пока пуст." />
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
                        <NButton native-type="button" :disabled="item.quantity <= 0"
                            aria-label="Уменьшить количество" @click="item.quantity = Math.max(0, item.quantity - 1)">
                            −</NButton>
                        <NButton native-type="button" aria-label="Увеличить количество"
                            @click="item.quantity += 1">
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
                <NButton v-if="isConsumable(item)" :disabled="item.quantity <= 0"
                    @click="item.quantity = Math.max(0, item.quantity - 1)">Использовать</NButton>
                <EntryActions @edit="openEditor(item)" @remove="remove(item.id)" />
            </div>
        </div>
        <InventoryItemEditorModal v-if="
            editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
        " :item="editorModal.item.value" v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
