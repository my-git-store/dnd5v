<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NTab, NTabs } from 'naive-ui'
import { useModalUtil } from '@/composables/useModal'
import CharacterSheetHeader from '@/modules/character-identity/components/CharacterSheetHeader.vue'
import CharacterLoadState from '@/components/CharacterLoadState.vue'
import CharacterMainTab from '@/modules/character-main/components/CharacterMainTab.vue'
import CharacterCombatTab from '@/modules/character-combat/CharacterCombatTab.vue'
import CharacterMagicTab from '@/modules/character-magic/components/CharacterMagicTab.vue'
import CharacterInventoryTab from '@/modules/character-inventory/components/CharacterInventoryTab.vue'
import CharacterBioTab from '@/modules/character-identity/components/CharacterBioTab.vue'
import CharacterActionConfirmModal, {
    type Props as ActionModalProps,
} from '@/components/CharacterActionConfirmModal.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'

const tabs = [
    { name: 'Основное', value: 'main' },
    { name: 'Бой', value: 'combat' },
    { name: 'Магия / Заклинания', value: 'magic' },
    { name: 'Инвентарь', value: 'inventory' },
    { name: 'БИО', value: 'bio' },
] as const

const activeTab = ref('main')

const {
    character,
    isLoading,
    loadError,
    load,
    createCharacter: createSheetCharacter,
} = useCharacterSheet()

const actionModal = useModalUtil<undefined, ActionModalProps>()

function createCharacter() {
    if (character.value || loadError.value) {
        actionModal.props.value = {
            title: 'Создать нового персонажа?',
            message: 'Новый персонаж заменит текущий лист и его сохранённые данные.',
            confirmLabel: 'Создать',
            onConfirm: createSheetCharacter,
        }
        actionModal.openOrClose()
        return
    }
    createSheetCharacter()
}

onMounted(() => {
    load()
})
</script>
<template>
    <main class="p-6">
        <CharacterLoadState @create="createCharacter" />
        <template v-if="!isLoading && !loadError">
            <template v-if="character">
                <CharacterSheetHeader />
                <NTabs v-model:value="activeTab" type="line">
                    <NTab v-for="tab in tabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
                </NTabs>
                <div v-show="activeTab === 'main'" id="sheet-tab-panel-main">
                    <CharacterMainTab />
                </div>
                <div v-show="activeTab === 'combat'" id="sheet-tab-panel-combat">
                    <CharacterCombatTab />
                </div>
                <div v-show="activeTab === 'magic'" id="sheet-tab-panel-magic">
                    <CharacterMagicTab />
                </div>
                <div v-show="activeTab === 'inventory'" id="sheet-tab-panel-inventory">
                    <CharacterInventoryTab />
                </div>
                <div v-show="activeTab === 'bio'" id="sheet-tab-panel-bio">
                    <CharacterBioTab />
                </div>
            </template>
            <section v-else aria-live="polite">
                <h1>Персонаж не создан</h1>
                <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
                <NButton type="primary" @click="createCharacter">Создать персонажа</NButton>
            </section>
        </template>
        <CharacterActionConfirmModal v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value" @close="actionModal.openOrClose" />
    </main>
</template>
