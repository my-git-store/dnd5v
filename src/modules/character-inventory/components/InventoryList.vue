<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCheckbox } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { useModalUtil } from '@/composables/useModal'
import { searchFilterObject } from '@/composables/useFilters'

import InventoryItemEditorModal, {
    type Props as EditorModalProps,
} from './InventoryItemEditorModal.vue'

import CEntryActions from '@/components/CEntryActions.vue'
import CSearch from '@/components/CSearch.vue'

import type { CharacterInventoryItemRecord } from '@/types/character'
import { getEntryKey } from '@/utils/getEntryKey'

const { character } = useCharacterSheet()

const query = ref('')

const showEquipped = ref<boolean>(true);

const editorModal = useModalUtil<undefined, EditorModalProps>()

const visibleItems = computed(() => {
    const items = character.value?.inventory.items ?? []

    return items.filter(item => {
        const matchesEquipment = item.equipped ? showEquipped.value : showEquipped.value

        const matchesSearch = searchFilterObject([item], ['name'], query.value).length > 0

        return matchesEquipment && matchesSearch
    })
})

function openEditor(item?: CharacterInventoryItemRecord) {
    editorModal.props.value = {
        item,
        onSave: updatedItem => {
            if (!character.value) return

            if (item && character.value.inventory.items.includes(item)) {
                Object.assign(item, updatedItem)
                return
            }

            character.value.inventory.items.push(updatedItem)
        },
    }

    editorModal.openOrClose()
}

function remove(item: CharacterInventoryItemRecord) {
    if (!character.value) return

    character.value.inventory.items = character.value.inventory.items.filter(
        current => current !== item,
    )
}

function changeQuantity(item: CharacterInventoryItemRecord, amount: number) {
    item.quantity = Math.max(0, item.quantity + amount)
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3>Предметы</h3>
            <NButton @click="openEditor()">Добавить</NButton>
        </div>

        <CSearch v-model:query="query" label="Поиск по инвентарю" />

        <NCheckbox v-model:checked="showEquipped">Экипированные</NCheckbox>

        <div v-for="item in visibleItems" :key="getEntryKey(item)"
            class="flex flex-wrap items-start justify-between gap-3 py-3">
            <div class="min-w-0">
                <h3>{{ item.name || 'Без названия' }}</h3>

                <span v-if="item.equipped">Экипировано</span>

                <div class="flex flex-wrap items-center gap-2">
                    <span>Количество: {{ item.quantity }}</span>

                    <NButton native-type="button" :disabled="item.quantity <= 0" aria-label="Уменьшить количество"
                        @click="changeQuantity(item, -1)">
                        −
                    </NButton>

                    <NButton native-type="button" aria-label="Увеличить количество" @click="changeQuantity(item, 1)">
                        +
                    </NButton>
                </div>
            </div>

            <CEntryActions @edit="openEditor(item)" @remove="remove(item)" />
        </div>

        <InventoryItemEditorModal v-if="editorModal.isShowModal.value && editorModal.props.value"
            v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
