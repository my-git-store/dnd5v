<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import CharacterSheetHeader from '@/modules/character-identity/components/CharacterSheetHeader.vue'
import CharacterLoadState from '@/components/CharacterLoadState.vue'
import CharacterMainTab from '@/modules/character-main/components/CharacterMainTab.vue'
import CharacterCombatTab from '@/modules/character-combat/components/CharacterCombatTab.vue'
import CharacterMagicTab from '@/modules/character-magic/components/CharacterMagicTab.vue'
import CharacterInventoryTab from '@/modules/character-inventory/components/CharacterInventoryTab.vue'
import CharacterBioTab from '@/modules/character-identity/components/CharacterBioTab.vue'
import CharacterActionConfirmModal from '@/components/CharacterActionConfirmModal.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { AbilityKey, CharacterSpellLevel } from '@/types/character'
import type { ShortRestResult } from '@/domain/rest'

const tabs = [
    { name: 'Основное', value: 'main' },
    { name: 'Бой', value: 'combat' },
    { name: 'Магия / Заклинания', value: 'magic' },
    { name: 'Инвентарь', value: 'inventory' },
    { name: 'БИО', value: 'bio' },
] as const

const visibleTabValues = new Set(tabs.map(tab => tab.value))

function readActiveTab(): string {
    try {
        return sessionStorage.getItem('nastolka:sheet:active-tab') ?? 'main'
    } catch {
        return 'main'
    }
}

const storedTab = readActiveTab()

const activeTab = ref<string>(
    visibleTabValues.has(storedTab as (typeof tabs)[number]['value']) ? storedTab : 'main',
)

const sheet = useCharacterSheet()

type ActionModalProps = {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
}

const actionModal = useModalUtil<undefined, ActionModalProps>()

watch(activeTab, next => {
    if (!visibleTabValues.has(next as (typeof tabs)[number]['value'])) {
        activeTab.value = 'main'
        return
    }
    const scrollPosition = window.scrollY
    void nextTick(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }))
})
watch(activeTab, tab => {
    if (!visibleTabValues.has(tab as (typeof tabs)[number]['value'])) return
    try {
        sessionStorage.setItem('nastolka:sheet:active-tab', tab)
    } catch {
        /* ignore unavailable session storage */
    }
})
function updateAbility(key: AbilityKey, value: number) {
    sheet.updateAbility(key, value)
}
function takeShortRest(dice: number): ShortRestResult | null {
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
function openActionConfirm(
    title: string,
    message: string,
    confirmLabel: string,
    action: () => void | Promise<void>,
    danger = false,
) {
    actionModal.props.value = { title, message, confirmLabel, danger, onConfirm: action }
    actionModal.openOrClose()
}
function createCharacter() {
    if (sheet.character.value || sheet.loadError.value) {
        openActionConfirm(
            'Создать нового персонажа?',
            'Новый персонаж заменит текущий лист и его сохранённые данные.',
            'Создать',
            sheet.createCharacter,
        )
        return
    }
    sheet.createCharacter()
}
</script>
<template>
    <main class="p-6">
        <CharacterLoadState
            :loading="sheet.isLoading.value"
            :error="sheet.loadError.value"
            @retry="sheet.load"
            @create="createCharacter"
        />
        <template v-if="!sheet.isLoading.value && !sheet.loadError.value">
            <section v-if="!sheet.character.value" aria-live="polite">
                <h1>Персонаж не создан</h1>
                <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
                <NButton type="primary" @click="createCharacter">Создать персонажа</NButton>
            </section>
        </template>
        <template v-if="sheet.character.value && !sheet.isLoading.value && !sheet.loadError.value">
            <CharacterSheetHeader
                :character="sheet.character.value"
                :dirty="sheet.isDirty.value"
                :saving="sheet.isSaving.value"
                :saved="sheet.savedNotice.value"
                :save-error="sheet.saveError.value"
                @save="sheet.save"
                @update="sheet.updateIdentity"
            />
            <div>
                <div>
                    <NTabs v-model:value="activeTab" type="line">
                        <NTab
                            v-for="tab in tabs"
                            :key="tab.value"
                            :name="tab.value"
                            :tab="tab.name"
                        />
                    </NTabs>
                </div>
            </div>
            <div>
                <div v-show="activeTab === 'main'" id="sheet-tab-panel-main">
                    <CharacterMainTab
                        :character="sheet.character.value"
                        :disabled="sheet.isSaving.value"
                        @update:saving-throw="sheet.updateSavingThrow"
                        @update:ability="updateAbility"
                        @update:skill="sheet.updateSkill"
                        @update:feats="sheet.updateFeats"
                    />
                </div>
                <div v-show="activeTab === 'combat'" id="sheet-tab-panel-combat">
                    <CharacterCombatTab
                        :character="sheet.character.value"
                        :disabled="sheet.isSaving.value"
                        :on-short-rest="takeShortRest"
                        :on-long-rest="takeLongRest"
                        @update:combat="sheet.updateCombat"
                        @update:attacks="sheet.updateAttacks"
                    />
                </div>
                <div v-show="activeTab === 'magic'" id="sheet-tab-panel-magic">
                    <CharacterMagicTab
                        :character="sheet.character.value"
                        :disabled="sheet.isSaving.value"
                        @update:spells="sheet.updateSpells"
                        @update:cantrips="sheet.updateCantrips"
                        @update:spellcasting="sheet.updateSpellcasting"
                        @use-slot="useSpellSlot"
                    />
                </div>
                <div v-show="activeTab === 'inventory'" id="sheet-tab-panel-inventory">
                    <CharacterInventoryTab
                        :character="sheet.character.value"
                        :disabled="sheet.isSaving.value"
                        @update:inventory="sheet.updateInventory"
                        @update:money="sheet.updateMoney"
                        @use-item="useInventoryItem"
                    />
                </div>
                <div v-show="activeTab === 'bio'" id="sheet-tab-panel-bio">
                    <CharacterBioTab
                        :personality="sheet.character.value.personality"
                        :disabled="sheet.isSaving.value"
                        @update="sheet.updatePersonality"
                    />
                </div>
            </div>
        </template>
        <CharacterActionConfirmModal
            v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value"
            @close="actionModal.openOrClose"
        />
    </main>
</template>
