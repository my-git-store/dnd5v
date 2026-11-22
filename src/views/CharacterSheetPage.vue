<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NAlert, NTab, NTabs } from 'naive-ui'
import { useModalUtil } from '@/composables/useModal'
import CharacterSheetHeader from '@/modules/character-identity/components/CharacterSheetHeader.vue'
import CLoadState from '@/components/CLoadState.vue'
import NpcSheetPanel from '@/components/NpcSheetPanel.vue'
import CharacterManagerBar from '@/components/CharacterManagerBar.vue'
import CharacterTransferModal from '@/components/CharacterTransferModal.vue'
import CharacterMainTab from '@/modules/character-main/components/CharacterMainTab.vue'
import CharacterCombatTab from '@/modules/character-combat/CharacterCombatTab.vue'
import CharacterMagicTab from '@/modules/character-magic/components/CharacterMagicTab.vue'
import CharacterInventoryTab from '@/modules/character-inventory/components/CharacterInventoryTab.vue'
import CharacterBioTab from '@/modules/character-identity/components/CharacterBioTab.vue'
import CActionConfirmModal, {
    type Props as ActionModalProps,
} from '@/components/CActionConfirmModal.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import BestiaryPanel from '@/modules/bestiary/components/BestiaryPanel.vue'
import EncounterPlanner from '@/modules/encounter/components/EncounterPlanner.vue'
import TableComponentsShowcase from '@/modules/table-components/components/showcase/TableComponentsShowcase.vue'
import { bestiaryToNpc, type BestiaryEntry } from '@/modules/bestiary/types/bestiary'
import {
    exportStoredCharacters,
    importCharacterTransfer,
    parseCharacterTransfer,
    serializeCharacterTransfer,
    transferFilename,
    type ImportedCharacterPlan,
} from '@/api/characterTransferCompat'
import { findCompatibleRecord } from '@/api/characterCollectionCompat'
import { createDefaultNpcProfile } from '@/domain/npc'

const baseTabs = [
    { name: 'Основное', value: 'main' },
    { name: 'Бой', value: 'combat' },
    { name: 'Магия / Заклинания', value: 'magic' },
    { name: 'Инвентарь', value: 'inventory' },
    { name: 'БИО', value: 'bio' },
] as const

const activeTab = ref('main')
const status = ref<string | null>(null)
const statusKind = ref<'success' | 'error'>('success')
const transferPlan = ref<ImportedCharacterPlan | null>(null)

const {
    character,
    isLoading,
    loadError,
    storageWarning,
    saveError,
    isDirty,
    load,
    save,
    createCharacter: createSheetCharacter,
    internalCollectionEnabled,
    internalTransferEnabled,
    internalNpcEnabled,
    characters,
    activeId,
    npcRecords,
    activeNpc,
    activeNpcId,
    isNpcDirty,
    selectCharacter,
    copyCharacter,
    deleteCharacter,
    selectNpc,
    createNpc,
    saveNpc,
    copyNpc,
    deleteNpc,
} = useCharacterSheet()

const featureFlags = {
    bestiary: !import.meta.env.PROD && import.meta.env.VITE_ENABLE_BESTIARY === 'true',
    encounter: !import.meta.env.PROD && import.meta.env.VITE_ENABLE_ENCOUNTER_PLANNER === 'true',
    components: !import.meta.env.PROD && import.meta.env.VITE_ENABLE_COMPONENTS === 'true',
}

const npcOptions = computed(() => npcRecords.value.map(record => ({
    id: record.id,
    name: record.character.npc?.name || record.character.identity.name || 'Новый НПС',
})))
const activeNpcProfile = computed(() => internalNpcEnabled
    ? activeNpc.value?.npc ?? null
    : character.value?.npc ?? null)
const activeNpcSheetDirty = computed(() => internalNpcEnabled ? isNpcDirty.value : isDirty.value)
const activeNpcSheetSaved = computed(() => !activeNpcSheetDirty.value)

const tabs = computed(() => [
    ...baseTabs,
    ...(featureFlags.bestiary ? [{ name: 'Бестиарий', value: 'bestiary' }] : []),
    ...(featureFlags.encounter ? [{ name: 'Планировщик столкновения', value: 'encounter' }] : []),
    ...(featureFlags.components ? [{ name: 'Компоненты', value: 'components' }] : []),
    ...((internalNpcEnabled && activeNpc.value) || (featureFlags.bestiary && character.value?.npc)
        ? [{ name: 'Лист НПС', value: 'npc' }]
        : []),
])

const actionModal = useModalUtil<undefined, ActionModalProps>()

function notify(message: string, kind: 'success' | 'error' = 'success') {
    status.value = message
    statusKind.value = kind
}

function createCharacter() {
    if (internalCollectionEnabled) {
        const createAfterSave = () => {
            if (isDirty.value && save() === false) return
            createSheetCharacter()
            activeTab.value = 'main'
            notify('Создан отдельный персонаж.')
        }
        if (isDirty.value) {
            actionModal.props.value = {
                title: 'Сохранить текущего персонажа?',
                message: 'Перед созданием нового листа нужно сохранить изменения активного персонажа.',
                confirmLabel: 'Сохранить и создать',
                onConfirm: createAfterSave,
            }
            actionModal.openOrClose()
        } else createAfterSave()
        return
    }
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

function createNpcFromBestiary(entry: BestiaryEntry) {
    if (internalNpcEnabled) {
        if (createNpc(bestiaryToNpc(entry))) {
            activeTab.value = 'npc'
            notify(`Создан отдельный НПС на основе существа «${entry.name}».`)
        } else notify('Не удалось создать отдельную запись НПС.', 'error')
        return
    }
    if (!character.value) return
    if (character.value.npc) {
        status.value = 'В активном листе уже есть профиль НПС. Он сохранён без изменений.'
        return
    }
    character.value.npc = bestiaryToNpc(entry)
    activeTab.value = 'npc'
    status.value = `Создана редактируемая копия: ${entry.name}.`
    save()
}

function confirmSwitchCharacter(id: string) {
    if (!isDirty.value) {
        selectCharacter(id)
        return
    }
    actionModal.props.value = {
        title: 'Сохранить изменения перед переключением?',
        message: 'Несохранённые изменения текущего листа будут сохранены перед открытием выбранного персонажа.',
        confirmLabel: 'Сохранить и переключить',
        onConfirm: () => { if (save() !== false) selectCharacter(id) },
    }
    actionModal.openOrClose()
}

function confirmCopyCharacter() {
    const copy = () => {
        if (isDirty.value && save() === false) return
        if (copyCharacter()) notify('Создана отдельная копия персонажа.')
        else notify('Не удалось скопировать персонажа.', 'error')
    }
    if (isDirty.value) {
        actionModal.props.value = {
            title: 'Сохранить изменения перед копированием?',
            message: 'Сначала будут сохранены изменения исходного листа, затем создастся его копия.',
            confirmLabel: 'Сохранить и копировать',
            onConfirm: copy,
        }
        actionModal.openOrClose()
    } else copy()
}

function confirmDeleteCharacter() {
    actionModal.props.value = {
        title: 'Удалить выбранного персонажа?',
        message: 'Запись будет удалена из внутреннего списка. Исторические исходные данные останутся доступными для восстановления.',
        confirmLabel: 'Удалить',
        onConfirm: () => {
            if (isDirty.value && save() === false) return
            if (deleteCharacter()) notify('Персонаж удалён из активного списка.')
            else notify('Не удалось удалить персонажа.', 'error')
        },
    }
    actionModal.openOrClose()
}

function confirmSwitchNpc(id: string) {
    if (!isNpcDirty.value) {
        selectNpc(id)
        activeTab.value = 'npc'
        return
    }
    actionModal.props.value = {
        title: 'Сохранить изменения НПС?',
        message: 'Изменения текущего НПС будут сохранены перед переключением.',
        confirmLabel: 'Сохранить и переключить',
        onConfirm: () => { if (saveNpc() && selectNpc(id)) activeTab.value = 'npc' },
    }
    actionModal.openOrClose()
}

function createNewNpc() {
    const create = () => {
        if (isNpcDirty.value && !saveNpc()) return
        if (createNpc(createDefaultNpcProfile())) {
            activeTab.value = 'npc'
            notify('Создан отдельный лист НПС.')
        } else notify('Не удалось создать НПС.', 'error')
    }
    if (isNpcDirty.value) {
        actionModal.props.value = {
            title: 'Сохранить изменения НПС?',
            message: 'Сначала сохраните текущую запись, затем будет создан отдельный НПС.',
            confirmLabel: 'Сохранить и создать',
            onConfirm: create,
        }
        actionModal.openOrClose()
    } else create()
}

function confirmCopyNpc() {
    const copy = () => {
        if (isNpcDirty.value && !saveNpc()) return
        if (copyNpc()) notify('Создана отдельная копия НПС.')
        else notify('Не удалось скопировать НПС.', 'error')
    }
    if (isNpcDirty.value) {
        actionModal.props.value = { title: 'Сохранить изменения НПС?', message: 'Перед копированием будет сохранена текущая запись.', confirmLabel: 'Сохранить и копировать', onConfirm: copy }
        actionModal.openOrClose()
    } else copy()
}

function confirmDeleteNpc() {
    actionModal.props.value = {
        title: 'Удалить выбранного НПС?',
        message: 'Запись будет убрана из активного списка; исходные исторические данные сохранятся.',
        confirmLabel: 'Удалить',
        onConfirm: () => {
            if (isNpcDirty.value && !saveNpc()) return
            if (deleteNpc()) notify('НПС удалён из активного списка.')
            else notify('Не удалось удалить НПС.', 'error')
        },
    }
    actionModal.openOrClose()
}

function downloadJson(contents: string, filename: string) {
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

function exportCurrentCharacter() {
    if (!character.value) return
    if (isDirty.value && save() === false) {
        notify('Не удалось сохранить текущие изменения; экспорт отменён.', 'error')
        return
    }
    try {
        const record = findCompatibleRecord(activeId.value ?? character.value.id ?? '', 'character')
        if (!record) throw new Error('Текущая запись не найдена.')
        downloadJson(serializeCharacterTransfer([record]), transferFilename(character.value.identity.name || character.value.identity.class))
        notify('Файл персонажа подготовлен к скачиванию.')
    } catch (error) { notify(error instanceof Error ? error.message : 'Не удалось экспортировать персонажа.', 'error') }
}

function exportAllRecords() {
    if (isDirty.value && save() === false) {
        notify('Не удалось сохранить текущие изменения; экспорт отменён.', 'error')
        return
    }
    try {
        downloadJson(exportStoredCharacters(window.localStorage), transferFilename('nastolka-personazhi'))
        notify('Файл коллекции подготовлен к скачиванию.')
    } catch (error) { notify(error instanceof Error ? error.message : 'Не удалось экспортировать коллекцию.', 'error') }
}

async function readImportFile(file: File) {
    if (file.size > 4 * 1024 * 1024) {
        notify('Файл импорта превышает допустимый размер 4 МБ.', 'error')
        return
    }
    try { transferPlan.value = parseCharacterTransfer(await file.text()) }
    catch (error) { notify(error instanceof Error ? error.message : 'Не удалось прочитать файл импорта.', 'error') }
}

function importFile(file: File) {
    if (isDirty.value) {
        actionModal.props.value = {
            title: 'Сохранить изменения перед импортом?',
            message: 'Текущий лист будет сохранён перед проверкой импортируемого файла.',
            confirmLabel: 'Сохранить и продолжить',
            onConfirm: () => { if (save() !== false) void readImportFile(file) },
        }
        actionModal.openOrClose()
    } else void readImportFile(file)
}

function applyImport(mode: 'add' | 'replace') {
    if (!transferPlan.value) return
    try {
        const result = importCharacterTransfer(transferPlan.value, window.localStorage, { mode, activeCharacterId: activeId.value })
        transferPlan.value = null
        load(result.importedCharacterIds[0] ?? activeId.value)
        const renameText = result.renamedIds.length ? ` Совпадающие ID заменены новыми для ${result.renamedIds.length} записей.` : ''
        notify(`Импортировано: ${result.importedCharacterIds.length} персонажей и ${result.importedNpcIds.length} НПС.${renameText}`)
    } catch (error) { notify(error instanceof Error ? error.message : 'Импорт не выполнен; исходные данные сохранены.', 'error') }
}

function updateActiveNpc(profile: NonNullable<typeof activeNpcProfile.value>) {
    if (internalNpcEnabled && activeNpc.value) activeNpc.value.npc = profile
    else if (character.value) character.value.npc = profile
}

async function saveActiveNpc(): Promise<void> {
    if (internalNpcEnabled) saveNpc()
    else save()
}

function saveEncounters(encounters: NonNullable<typeof character.value>['encounters']) {
    if (!character.value) return
    character.value.encounters = encounters
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
            <NAlert v-if="storageWarning" type="warning" role="status" class="mt-4">
                {{ storageWarning }}
            </NAlert>
            <CharacterManagerBar
                v-if="internalCollectionEnabled"
                class="mt-4"
                :characters="characters"
                :active-id="activeId"
                :npcs="npcOptions"
                :active-npc-id="activeNpcId"
                :character-dirty="isDirty"
                :npc-dirty="isNpcDirty"
                :allow-npcs="internalNpcEnabled"
                :allow-transfer="internalTransferEnabled"
                @select-character="confirmSwitchCharacter"
                @create-character="createCharacter"
                @copy-character="confirmCopyCharacter"
                @delete-character="confirmDeleteCharacter"
                @export-character="exportCurrentCharacter"
                @export-all="exportAllRecords"
                @import-file="importFile"
                @select-npc="confirmSwitchNpc"
                @create-npc="createNewNpc"
                @copy-npc="confirmCopyNpc"
                @delete-npc="confirmDeleteNpc"
            />
            <div class="flex flex-col gap-4" v-if="character">
                <NTabs v-model:value="activeTab" type="line">
                    <NTab v-for="tab in tabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
                </NTabs>
                <CharacterMainTab v-if="activeTab === 'main'" />
                <CharacterCombatTab v-if="activeTab === 'combat'" />
                <CharacterMagicTab v-if="activeTab === 'magic'" />
                <CharacterInventoryTab v-if="activeTab === 'inventory'" />
                <CharacterBioTab v-if="activeTab === 'bio'" />
                <BestiaryPanel
                    v-if="featureFlags.bestiary && activeTab === 'bestiary'"
                    :on-create-npc="createNpcFromBestiary"
                    @status="status = $event"
                />
                <EncounterPlanner
                    v-if="featureFlags.encounter && activeTab === 'encounter'"
                    :encounters="character.encounters"
                    :dirty="isDirty"
                    :saving="false"
                    @update="saveEncounters"
                    @status="status = $event"
                />
                <TableComponentsShowcase
                    v-if="featureFlags.components && activeTab === 'components'"
                />
                <NpcSheetPanel
                    v-if="activeTab === 'npc' && activeNpcProfile"
                    :npc="activeNpcProfile"
                    :dirty="activeNpcSheetDirty"
                    :saving="false"
                    :saved="activeNpcSheetSaved"
                    :save-error="saveError"
                    :on-save="saveActiveNpc"
                    @update="updateActiveNpc"
                />
                <NAlert v-if="status" :type="statusKind" :role="statusKind === 'error' ? 'alert' : 'status'" class="mt-3">
                    {{ status }}
                </NAlert>
            </div>
            <section v-else aria-live="polite">
                <h1>Персонаж не создан</h1>
                <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
            </section>
            <NpcSheetPanel
                v-if="!character && internalNpcEnabled && activeTab === 'npc' && activeNpcProfile"
                class="mt-4"
                :npc="activeNpcProfile"
                :dirty="activeNpcSheetDirty"
                :saving="false"
                :saved="activeNpcSheetSaved"
                :save-error="saveError"
                :on-save="saveActiveNpc"
                @update="updateActiveNpc"
            />
        </template>
        <CActionConfirmModal
            v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value"
            @close="actionModal.openOrClose"
        />
        <CharacterTransferModal
            v-if="transferPlan"
            :plan="transferPlan"
            @close="transferPlan = null"
            @confirm="applyImport"
        />
    </main>
</template>
