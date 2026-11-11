<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import CharacterSheetHeader from '@/modules/character-identity/components/CharacterSheetHeader.vue'
import CharacterLoadState from '@/components/CharacterLoadState.vue'
import CharacterMainTab from '@/modules/character-main/components/CharacterMainTab.vue'
import CharacterCombatTab from '@/modules/character-combat/components/CharacterCombatTab.vue'
import CharacterMagicTab from '@/modules/character-magic/components/CharacterMagicTab.vue'
import CharacterInventoryTab from '@/modules/character-inventory/components/CharacterInventoryTab.vue'
import CharacterBioTab from '@/modules/character-identity/components/CharacterBioTab.vue'
import CharacterCreationTab from '@/modules/character-creation/components/CharacterCreationTab.vue'
import CharacterIdentityModal from '@/modules/character-identity/components/CharacterIdentityModal.vue'
import CharacterManagerBar from '@/components/CharacterManagerBar.vue'
import NpcSheetPanel from '@/components/NpcSheetPanel.vue'
import CharacterActionConfirmModal from '@/components/CharacterActionConfirmModal.vue'
import CollapsibleSheetSection from '@/components/CollapsibleSheetSection.vue'
import LevelUpModal from '@/modules/character-progression/components/LevelUpModal.vue'
import TableComponentsShowcase from '@/modules/table-components/components/showcase/TableComponentsShowcase.vue'
import BestiaryPanel from '@/modules/bestiary/components/BestiaryPanel.vue'
import { bestiaryToNpc, type BestiaryEntry } from '@/modules/bestiary/types/bestiary.ts'
import EncounterPlanner from '@/modules/encounter/components/EncounterPlanner.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { AbilityKey, CharacterSpellLevel } from '@/types/character'
import type { CharacterIdentityPatch, CharacterSheetView } from '@/types/characterView'
import type { ShortRestResult } from '@/domain/rest'
import { classIconFor } from '@/data/classIcons.ts'
import { speciesIconFor } from '@/data/speciesIcons.ts'
import { backgroundIconFor } from '@/data/backgroundIcons.ts'

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

const tabDirection = ref<'forward' | 'backward'>('forward')

const creationOpen = ref(false)

const creationSession = ref(0)

const creationError = ref<string | null>(null)

const transferStatus = ref<{ kind: 'success' | 'error'; text: string } | null>(null)

const sheet = useCharacterSheet()

type IdentityModalProps = {
    character: CharacterSheetView
    disabled?: boolean
    onUpdate: (patch: CharacterIdentityPatch) => void
}

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

const identityModal = useModalUtil<undefined, IdentityModalProps>()

const levelUpModal = useModalUtil<undefined, LevelUpModalProps>()

const actionModal = useModalUtil<undefined, ActionModalProps>()

const tabIndexes = new Map<string, number>(tabs.map((tab, index) => [tab.value, index]))
watch(activeTab, (next, previous) => {
    if (!visibleTabValues.has(next as (typeof tabs)[number]['value'])) {
        activeTab.value = 'main'
        return
    }
    tabDirection.value =
        (tabIndexes.get(next) ?? 0) >= (tabIndexes.get(previous) ?? 0) ? 'forward' : 'backward'
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
function tabPanelClass(tab: string) {
    return {
        'sheet-tab-panel-active': activeTab.value === tab,
        [`sheet-tab-panel-${tabDirection.value}`]: activeTab.value === tab,
    }
}
function updateAbility(key: AbilityKey, value: number) {
    sheet.updateAbility(key, value)
}
function applyCreation(payload: Parameters<typeof sheet.applyCreation>[0]) {
    try {
        sheet.applyCreation(payload)
        creationError.value = null
    } catch (error) {
        creationError.value =
            error instanceof Error ? error.message : 'Не удалось создать персонажа.'
    }
}
function closeCreation() {
    creationOpen.value = false
    activeTab.value = 'main'
}
function openCreationModal() {
    if (sheet.character.value) {
        creationSession.value += 1
        creationError.value = null
        creationOpen.value = true
    }
}
function updateIdentity(patch: CharacterIdentityPatch) {
    sheet.updateIdentity(patch)
}
function openIdentityModal() {
    if (!sheet.character.value) return
    identityModal.props.value = {
        character: sheet.character.value,
        disabled: sheet.isSaving.value,
        onUpdate: updateIdentity,
    }
    identityModal.openOrClose()
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

const selectedClassIcon = computed(() =>
    classIconFor(
        sheet.character.value?.creation?.classId ?? sheet.character.value?.class ?? '',
        sheet.character.value?.creation?.gender ?? 'female',
    ),
)

const selectedSpeciesIcon = computed(() =>
    sheet.character.value
        ? speciesIconFor(
            sheet.character.value.creation?.speciesId ?? sheet.character.value.race.name,
        )
        : undefined,
)

const selectedBackgroundIcon = computed(() =>
    backgroundIconFor(
        sheet.character.value?.creation?.backgroundId ??
        sheet.character.value?.origin.background ??
        sheet.character.value?.background.name,
    ),
)
</script>
<template>
    <main class="c-character-sheet" :class="{
        'character-sheet-creation-mode': creationOpen,
    }">
        <CharacterLoadState :loading="sheet.isLoading.value" :error="sheet.loadError.value" @retry="sheet.load" @create="createCharacter" />
        <template v-if="!sheet.isLoading.value && !sheet.loadError.value">
            <CharacterManagerBar :characters="sheet.characters.value" :active-id="sheet.activeId.value"
                :dirty="sheet.isDirty.value" :disabled="sheet.isSaving.value" :status="transferStatus"
                @create="openCreationModal" />
            <section v-if="!sheet.character.value" class="character-empty-state c-sheet-section" aria-live="polite">
                <h1>Персонажи не найдены</h1>
                <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
                <NButton type="primary" @click="createCharacter">Создать персонажа</NButton>
            </section>
        </template>
        <template v-if="sheet.character.value && !sheet.isLoading.value && !sheet.loadError.value">
            <section v-if="creationOpen" class="character-creation-root" aria-label="Создание персонажа">
                <CharacterCreationTab :key="creationSession" :character="sheet.character.value"
                    :disabled="sheet.isSaving.value" :creation-error="creationError" hide-preview
                    @create="applyCreation" @back-to-sheet="closeCreation" />
            </section>
            <template v-else>
                <NpcSheetPanel v-if="sheet.character.value.kind === 'npc'" :character="sheet.character.value"
                    :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value" :saved="sheet.savedNotice.value"
                    :save-error="sheet.saveError.value" :on-save="sheet.save" @update="sheet.updateNpc" />
                <template v-else>
                    <CharacterSheetHeader :name="sheet.character.value.name" :race="sheet.character.value.race.name"
                        :species-icon="selectedSpeciesIcon" :class-name="sheet.character.value.class"
                        :class-icon="selectedClassIcon" :background-name="sheet.character.value.background.name ||
                            sheet.character.value.origin.background
                            " :background-icon="selectedBackgroundIcon"
                        :level="sheet.character.value.level" :experience="sheet.character.value.experience"
                        :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value" :saved="sheet.savedNotice.value"
                        :save-error="sheet.saveError.value" @save="sheet.save" @open-details="openIdentityModal" />
                    <div class="sheet-tabs-row">
                        <div class="sheet-tabs">
                            <NTabs v-model:value="activeTab" type="line">
                                <NTab v-for="tab in tabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
                            </NTabs>
                        </div>
                    </div>
                    <div class="sheet-tab-stage">
                        <div v-show="activeTab === 'main'" id="sheet-tab-panel-main" class="sheet-tab-panel"
                            :class="tabPanelClass('main')">
                            <CollapsibleSheetSection id="main-section" title="Основное"
                                :storage-key="sheet.activeId.value ?? 'empty'" :force-open="Boolean(
                                    sheet.saveError.value || transferStatus?.kind === 'error',
                                )
                                    ">
                                <CharacterMainTab :character="sheet.character.value" :disabled="sheet.isSaving.value"
                                    @update:saving-throw="sheet.updateSavingThrow" @update:ability="updateAbility"
                                    @update:skill="sheet.updateSkill" @update:feats="sheet.updateFeats"
                                    @level-up="openLevelUpModal" />
                            </CollapsibleSheetSection>
                        </div>
                        <div v-show="activeTab === 'combat'" id="sheet-tab-panel-combat" class="sheet-tab-panel"
                            :class="tabPanelClass('combat')">
                            <CollapsibleSheetSection id="combat-section" title="Бой"
                                :storage-key="sheet.activeId.value ?? 'empty'" :force-open="Boolean(
                                    sheet.saveError.value || transferStatus?.kind === 'error',
                                )
                                    ">
                                <CharacterCombatTab :character="sheet.character.value" :disabled="sheet.isSaving.value"
                                    :on-short-rest="takeShortRest" :on-long-rest="takeLongRest"
                                    @update:combat="sheet.updateCombat" @update:attacks="sheet.updateAttacks" />
                            </CollapsibleSheetSection>
                        </div>
                        <div v-show="activeTab === 'magic'" id="sheet-tab-panel-magic" class="sheet-tab-panel"
                            :class="tabPanelClass('magic')">
                            <CollapsibleSheetSection id="magic-section" title="Магия и заклинания"
                                :storage-key="sheet.activeId.value ?? 'empty'" :force-open="Boolean(
                                    sheet.saveError.value || transferStatus?.kind === 'error',
                                )
                                    ">
                                <CharacterMagicTab :character="sheet.character.value" :disabled="sheet.isSaving.value"
                                    @update:spells="sheet.updateSpells" @update:cantrips="sheet.updateCantrips"
                                    @update:spellcasting="sheet.updateSpellcasting" @use-slot="useSpellSlot" />
                            </CollapsibleSheetSection>
                        </div>
                        <div v-show="activeTab === 'inventory'" id="sheet-tab-panel-inventory" class="sheet-tab-panel"
                            :class="tabPanelClass('inventory')">
                            <CollapsibleSheetSection id="inventory-section" title="Инвентарь"
                                :storage-key="sheet.activeId.value ?? 'empty'" :force-open="Boolean(
                                    sheet.saveError.value || transferStatus?.kind === 'error',
                                )
                                    ">
                                <CharacterInventoryTab :character="sheet.character.value"
                                    :disabled="sheet.isSaving.value" @update:inventory="sheet.updateInventory"
                                    @update:money="sheet.updateMoney" @use-item="useInventoryItem" />
                            </CollapsibleSheetSection>
                        </div>
                        <div v-show="activeTab === 'bio'" id="sheet-tab-panel-bio" class="sheet-tab-panel"
                            :class="tabPanelClass('bio')">
                            <CollapsibleSheetSection id="bio-section" title="Биография"
                                :storage-key="sheet.activeId.value ?? 'empty'" :force-open="Boolean(
                                    sheet.saveError.value || transferStatus?.kind === 'error',
                                )
                                    ">
                                <CharacterBioTab :personality="sheet.character.value.personality"
                                    :disabled="sheet.isSaving.value" @update="sheet.updatePersonality" />
                            </CollapsibleSheetSection>
                        </div>
                        <div v-if="
                            featureFlags.components &&
                            activeTab === 'table-components'
                        " class="sheet-tab-panel table-components-panel" :class="tabPanelClass('table-components')">
                            <TableComponentsShowcase />
                        </div>
                        <div v-if="featureFlags.bestiary && activeTab === 'bestiary'"
                            class="sheet-tab-panel bestiary-tab-panel" :class="tabPanelClass('bestiary')">
                            <BestiaryPanel :on-create-npc="createNpcFromBestiary" @status="
                                message => {
                                    transferStatus = { kind: 'success', text: message }
                                }
                            " />
                        </div>
                        <div v-if="featureFlags.encounter && activeTab === 'encounter'"
                            class="sheet-tab-panel encounter-tab-panel" :class="tabPanelClass('encounter')">
                            <EncounterPlanner :encounters="sheet.character.value.encounters"
                                :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value"
                                @update="sheet.updateEncounters" @status="
                                    message => {
                                        transferStatus = { kind: 'success', text: message }
                                    }
                                " />
                        </div>
                    </div>
                </template>
            </template>
        </template>
        <CharacterIdentityModal v-if="identityModal.isShowModal.value && identityModal.props.value"
            v-bind="identityModal.props.value" @close="identityModal.openOrClose" />
        <LevelUpModal v-if="levelUpModal.isShowModal.value && levelUpModal.props.value"
            v-bind="levelUpModal.props.value" @close="levelUpModal.openOrClose" />
        <CharacterActionConfirmModal v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value" @close="actionModal.openOrClose" />
    </main>
</template>

<style scoped>
.character-empty-state {
    display: grid;
    justify-items: center;
    gap: 9px;
    min-height: 300px;
    align-content: center;
    text-align: center;
}

.character-empty-state h1 {
    margin: 0;
    font-family: var(--font-serif);
}

.character-empty-state p {
    margin: 0 0 8px;
    color: var(--sheet-muted);
}

.character-creation-root {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 14px;
    border: 1px solid #c4a474;
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(255, 250, 239, 0.94), rgba(239, 220, 185, 0.72));
    box-shadow:
        0 10px 26px rgba(83, 59, 38, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.character-creation-root :deep(.creation-hero) {
    margin-top: 0;
}

.character-sheet-creation-mode {
    padding-top: 24px;
}

.character-sheet-creation-mode :deep(.creation-workspace) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
}

.character-sheet-creation-mode :deep(.creation-main-column) {
    width: 100%;
}

.sheet-tabs-row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin: 0 4px;
}

.sheet-tabs {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
    padding: 0 10px;
    border-bottom: 1px solid var(--sheet-line);
}

.sheet-tab-stage {
    position: relative;
    min-height: 260px;
}

.sheet-tab-panel {
    min-width: 0;
    transform-origin: 50% 0;
}

.sheet-tab-panel-active {
    animation-duration: 0.42s;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
    animation-fill-mode: both;
    will-change: opacity, transform, filter;
}

.sheet-tab-panel-forward {
    animation-name: sheet-tab-enter-forward;
}

.sheet-tab-panel-backward {
    animation-name: sheet-tab-enter-backward;
}

@keyframes sheet-tab-enter-forward {
    from {
        opacity: 0;
        transform: translate3d(22px, 8px, 0) scale(0.988);
        filter: blur(2px);
    }

    62% {
        opacity: 1;
        filter: blur(0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
    }
}

@keyframes sheet-tab-enter-backward {
    from {
        opacity: 0;
        transform: translate3d(-22px, 8px, 0) scale(0.988);
        filter: blur(2px);
    }

    62% {
        opacity: 1;
        filter: blur(0);
    }

    to {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
    }
}
</style>
