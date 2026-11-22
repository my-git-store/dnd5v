<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NTab, NTabs } from 'naive-ui'
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
    storageWarning,
    load,
    save,
    createCharacter: createSheetCharacter,
} = useCharacterSheet()

const actionModal = useModalUtil<undefined, ActionModalProps>()

function createCharacter() {
    if (character.value || loadError.value || storageWarning.value) {
        let message = 'Новый обычный персонаж будет создан в браузере.'
        if (character.value) {
            message =
                'Будет создан новый обычный персонаж. Текущий лист и изменения, не сохранённые кнопкой «Сохранить», будут заменены.'
            if (storageWarning.value) {
                message += ' Ранее сохранённые персонажи и НПС останутся в браузере.'
            }
        } else if (storageWarning.value) {
            message =
                'В браузере найдены прежние сохранения персонажей или НПС. Они останутся без изменений; для новой записи приложение сохранит несовместимые данные отдельно.'
        }
        actionModal.props.value = {
            title: 'Создать нового персонажа?',
            message,
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
    <main
        class="character-sheet-page mx-auto my-3 min-h-[calc(100vh-1.5rem)] w-full max-w-[1360px] px-3 py-4 sm:my-6 sm:px-6 sm:py-8"
    >
        <CLoadState @create="createCharacter" />
        <template v-if="!isLoading && !loadError">
            <CharacterSheetHeader @create="createCharacter" @save="save" />
            <div class="flex flex-col gap-4" v-if="character">
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
                <p
                    v-if="storageWarning"
                    class="mt-4 rounded-lg border border-amber-900/20 bg-amber-50/90 p-3"
                >
                    {{ storageWarning }}
                </p>
            </section>
        </template>
        <CActionConfirmModal
            v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value"
            @close="actionModal.openOrClose"
        />
    </main>
</template>
