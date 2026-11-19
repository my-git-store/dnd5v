<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NTab, NTabs } from 'naive-ui'
import { useModalUtil } from '@/composables/useModal'
import CharacterSheetHeader from '@/modules/character-identity/components/CharacterSheetHeader.vue'
import CLoadState from '@/components/CLoadState.vue'
import CharacterMainTab from '@/modules/character-main/components/CharacterMainTab.vue'
import CharacterCombatTab from '@/modules/character-combat/CharacterCombatTab.vue'
import CharacterMagicTab from '@/modules/character-magic/components/CharacterMagicTab.vue'
import CharacterInventoryTab from '@/modules/character-inventory/components/CharacterInventoryTab.vue'
import CharacterBioTab from '@/modules/character-identity/components/CharacterBioTab.vue'
import CActionConfirmModal, {
    type Props as ActionModalProps,
} from '@/components/CActionConfirmModal.vue'
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
        <CLoadState @create="createCharacter" />
        <template v-if="!isLoading && !loadError">
            <div class="flex flex-col gap-4" v-if="character">
                <CharacterSheetHeader />
                <NTabs v-model:value="activeTab" type="line">
                    <NTab v-for="tab in tabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
                </NTabs>
                <CharacterMainTab v-if="activeTab === 'main'" />
                <CharacterCombatTab v-if="activeTab === 'combat'" />
                <CharacterMagicTab v-if="activeTab === 'magic'" />
                <CharacterInventoryTab v-if="activeTab === 'inventory'" />
                <CharacterBioTab v-if="activeTab === 'bio'" />
            </div>
            <section v-else aria-live="polite">
                <h1>Персонаж не создан</h1>
                <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
                <NButton type="primary" @click="createCharacter">Создать персонажа</NButton>
            </section>
        </template>
        <CActionConfirmModal v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value" @close="actionModal.openOrClose" />
    </main>
</template>
