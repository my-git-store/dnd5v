<script setup lang="ts">
import { reactive, ref } from 'vue'
import { NButton, NTab, NTabs } from 'naive-ui'
import { useModalUtil } from '@/composables/useModal'
import CharacterSheetHeader from '@/modules/character-identity/components/CharacterSheetHeader.vue'
import CharacterLoadState from '@/components/CharacterLoadState.vue'
import CharacterMainTab from '@/modules/character-main/components/CharacterMainTab.vue'
import CharacterCombatTab from '@/modules/character-combat/components/CharacterCombatTab.vue'
import CharacterMagicTab from '@/modules/character-magic/components/CharacterMagicTab.vue'
import CharacterInventoryTab from '@/modules/character-inventory/components/CharacterInventoryTab.vue'
import CharacterBioTab from '@/modules/character-identity/components/CharacterBioTab.vue'
import CharacterActionConfirmModal, {
    type Props as ActionModalProps,
} from '@/components/CharacterActionConfirmModal.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterSpellLevel } from '@/types/character'

const tabs = [
    { name: 'Основное', value: 'main' },
    { name: 'Бой', value: 'combat' },
    { name: 'Магия / Заклинания', value: 'magic' },
    { name: 'Инвентарь', value: 'inventory' },
    { name: 'БИО', value: 'bio' },
] as const

const activeTab = ref('main')

const sheet = reactive(useCharacterSheet())

const actionModal = useModalUtil<undefined, ActionModalProps>()

function takeShortRest(dice: number) {
    const result = sheet.shortRest(dice)
    if (result) sheet.save()
    return result
}
function takeLongRest() {
    sheet.longRest()
    sheet.save()
}
function useSpellSlot(level: CharacterSpellLevel, delta: number) {
    sheet.adjustSpellSlot(level, delta)
    sheet.save()
}
function useInventoryItem(id: string) {
    if (sheet.useInventoryItem(id)) sheet.save()
}
function createCharacter() {
    if (sheet.character || sheet.loadError) {
        actionModal.props.value = {
            title: 'Создать нового персонажа?',
            message: 'Новый персонаж заменит текущий лист и его сохранённые данные.',
            confirmLabel: 'Создать',
            onConfirm: sheet.createCharacter,
        }
        actionModal.openOrClose()
        return
    }
    sheet.createCharacter()
}
</script>
<template>
    <main class="p-6">
        <CharacterLoadState :loading="sheet.isLoading" :error="sheet.loadError" @retry="sheet.load"
            @create="createCharacter" />
        <template v-if="!sheet.isLoading && !sheet.loadError">
            <template v-if="sheet.character">
                <CharacterSheetHeader :character="sheet.character" :dirty="sheet.isDirty" :saving="sheet.isSaving"
                    :saved="sheet.savedNotice" :save-error="sheet.saveError" @save="sheet.save"
                    @update="sheet.updateIdentity" />
                <NTabs v-model:value="activeTab" type="line">
                    <NTab v-for="tab in tabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
                </NTabs>
                <div v-show="activeTab === 'main'" id="sheet-tab-panel-main">
                    <CharacterMainTab :character="sheet.character" :disabled="sheet.isSaving"
                        @update:saving-throw="sheet.updateSavingThrow" @update:ability="sheet.updateAbility"
                        @update:skill="sheet.updateSkill" @update:feats="sheet.updateFeats" />
                </div>
                <div v-show="activeTab === 'combat'" id="sheet-tab-panel-combat">
                    <CharacterCombatTab :character="sheet.character" :disabled="sheet.isSaving"
                        :on-short-rest="takeShortRest" :on-long-rest="takeLongRest" @update:combat="sheet.updateCombat"
                        @update:attacks="sheet.updateAttacks" />
                </div>
                <div v-show="activeTab === 'magic'" id="sheet-tab-panel-magic">
                    <CharacterMagicTab :character="sheet.character" :disabled="sheet.isSaving"
                        @update:spells="sheet.updateSpells" @update:cantrips="sheet.updateCantrips"
                        @update:spellcasting="sheet.updateSpellcasting" @use-slot="useSpellSlot" />
                </div>
                <div v-show="activeTab === 'inventory'" id="sheet-tab-panel-inventory">
                    <CharacterInventoryTab :character="sheet.character" :disabled="sheet.isSaving"
                        @update:inventory="sheet.updateInventory" @update:money="sheet.updateMoney"
                        @use-item="useInventoryItem" />
                </div>
                <div v-show="activeTab === 'bio'" id="sheet-tab-panel-bio">
                    <CharacterBioTab :personality="sheet.character.personality" :disabled="sheet.isSaving"
                        @update="sheet.updatePersonality" />
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
