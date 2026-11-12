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
import NpcSheetPanel from '@/components/NpcSheetPanel.vue'
import CharacterActionConfirmModal from '@/components/CharacterActionConfirmModal.vue'
import LevelUpModal from '@/modules/character-progression/components/LevelUpModal.vue'
import TableComponentsShowcase from '@/modules/table-components/components/showcase/TableComponentsShowcase.vue'
import BestiaryPanel from '@/modules/bestiary/components/BestiaryPanel.vue'
import { bestiaryToNpc, type BestiaryEntry } from '@/modules/bestiary/types/bestiary.ts'
import EncounterPlanner from '@/modules/encounter/components/EncounterPlanner.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { AbilityKey, CharacterSpellLevel } from '@/types/character'
import type { CharacterSheetView } from '@/types/characterView'
import type { ShortRestResult } from '@/domain/rest'

const featureFlags = {
    bestiary: import.meta.env.VITE_ENABLE_BESTIARY === 'true',
    encounter: import.meta.env.VITE_ENABLE_ENCOUNTER_PLANNER === 'true',
    components: import.meta.env.VITE_ENABLE_COMPONENTS === 'true',
}

const tabs = [
    { name: 'Основное', value: 'main' },
    { name: 'Бой', value: 'combat' },
    { name: 'Магия / Заклинания', value: 'magic' },
    { name: 'Инвентарь', value: 'inventory' },
    { name: 'БИО', value: 'bio' },
    ...(featureFlags.bestiary ? [{ name: 'Бестиарий', value: 'bestiary' }] : []),
    ...(featureFlags.encounter ? [{ name: 'Планировщик столкновения', value: 'encounter' }] : []),
    ...(featureFlags.components ? [{ name: 'Игровые компоненты', value: 'table-components' }] : []),
] as const

const visibleTabValues = new Set(tabs.map(tab => tab.value))

const activeTab = ref<string>('main')

const sheet = useCharacterSheet()

type LevelUpModalProps = {
    character: CharacterSheetView
    disabled?: boolean
    onConfirm: () => void
}

type ActionModalProps = {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
}

const levelUpModal = useModalUtil<undefined, LevelUpModalProps>()

const actionModal = useModalUtil<undefined, ActionModalProps>()

watch(activeTab, next => {
    if (!visibleTabValues.has(next as (typeof tabs)[number]['value'])) {
        activeTab.value = 'main'
        return
    }
    const scrollPosition = window.scrollY
    void nextTick(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }))
})
watch(
    () => sheet.activeId.value,
    id => {
        if (!id) return
        try {
            const storedTab = sessionStorage.getItem(`nastolka:sheet:active-tab:${id}`) ?? 'main'
            activeTab.value = visibleTabValues.has(storedTab as (typeof tabs)[number]['value'])
                ? storedTab
                : 'main'
        } catch {
            activeTab.value = 'main'
        }
    },
    { immediate: true },
)
watch(activeTab, tab => {
    if (!visibleTabValues.has(tab as (typeof tabs)[number]['value'])) return
    const id = sheet.activeId.value
    if (!id) return
    try {
        sessionStorage.setItem(`nastolka:sheet:active-tab:${id}`, tab)
    } catch {
        /* ignore unavailable session storage */
    }
})
function updateAbility(key: AbilityKey, value: number) {
    sheet.updateAbility(key, value)
}
function openLevelUpModal() {
    if (
        !sheet.character.value ||
        sheet.character.value.level >= 20 ||
        !sheet.character.value.progression?.classLevels.length
    )
        return
    levelUpModal.props.value = {
        character: sheet.character.value,
        disabled: sheet.isSaving.value,
        onConfirm: sheet.levelUp,
    }
    levelUpModal.openOrClose()
}
async function takeShortRest(dice: number): Promise<ShortRestResult | null> {
    const result = sheet.shortRest(dice)
    if (result) await sheet.save()
    return result
}
async function takeLongRest() {
    sheet.longRest()
    await sheet.save()
}
async function useSpellSlot(level: CharacterSpellLevel, delta: number) {
    sheet.adjustSpellSlot(level, delta)
    await sheet.save()
}
async function useInventoryItem(id: string) {
    if (sheet.useInventoryItem(id)) await sheet.save()
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
    if (sheet.isDirty.value) {
        openActionConfirm(
            'Создать нового персонажа?',
            'Есть несохранённые изменения. При создании нового персонажа они будут отменены.',
            'Создать',
            async () => {
                await sheet.createCharacter()
            },
        )
        return
    }
    void sheet.createCharacter()
}
function createNpcFromBestiary(entry: BestiaryEntry) {
    const create = async () => {
        await sheet.createNpcFromProfile(bestiaryToNpc(entry))
        activeTab.value = 'main'
    }
    if (sheet.isDirty.value) {
        openActionConfirm(
            'Создать НПС из бестиария?',
            'Есть несохранённые изменения. При создании отдельной копии они будут отменены.',
            'Создать НПС',
            create,
        )
        return
    }
    void create()
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
                <h1>Персонажи не найдены</h1>
                <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
                <NButton type="primary" @click="createCharacter">Создать персонажа</NButton>
            </section>
        </template>
        <template v-if="sheet.character.value && !sheet.isLoading.value && !sheet.loadError.value">
            <NpcSheetPanel
                v-if="sheet.character.value.kind === 'npc'"
                :character="sheet.character.value"
                :dirty="sheet.isDirty.value"
                :saving="sheet.isSaving.value"
                :saved="sheet.savedNotice.value"
                :save-error="sheet.saveError.value"
                :on-save="sheet.save"
                @update="sheet.updateNpc"
            />
            <template v-else>
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
                            @level-up="openLevelUpModal"
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
                    <div v-if="featureFlags.components && activeTab === 'table-components'">
                        <TableComponentsShowcase />
                    </div>
                    <div v-if="featureFlags.bestiary && activeTab === 'bestiary'">
                        <BestiaryPanel :on-create-npc="createNpcFromBestiary" />
                    </div>
                    <div v-if="featureFlags.encounter && activeTab === 'encounter'">
                        <EncounterPlanner
                            :encounters="sheet.character.value.encounters"
                            :dirty="sheet.isDirty.value"
                            :saving="sheet.isSaving.value"
                            @update="sheet.updateEncounters"
                        />
                    </div>
                </div>
            </template>
        </template>
        <LevelUpModal
            v-if="levelUpModal.isShowModal.value && levelUpModal.props.value"
            v-bind="levelUpModal.props.value"
            @close="levelUpModal.openOrClose"
        />
        <CharacterActionConfirmModal
            v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value"
            @close="actionModal.openOrClose"
        />
    </main>
</template>
