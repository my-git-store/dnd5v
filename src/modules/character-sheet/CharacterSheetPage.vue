<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CBtn, CTabs, useDialog } from '@/ui/components'
import CharacterSheetHeader from './components/CharacterSheetHeader.vue'
import CharacterLoadState from './components/CharacterLoadState.vue'
import CharacterMainTab from './components/CharacterMainTab.vue'
import CharacterCombatTab from './components/CharacterCombatTab.vue'
import CharacterMagicTab from './components/CharacterMagicTab.vue'
import CharacterInventoryTab from './components/CharacterInventoryTab.vue'
import CharacterBioTab from './components/CharacterBioTab.vue'
import CharacterCreationTab from './components/CharacterCreationTab.vue'
import CharacterIdentityModal from './components/CharacterIdentityModal.vue'
import CharacterManagerBar from './components/CharacterManagerBar.vue'
import NpcSheetPanel from './components/NpcSheetPanel.vue'
import CharacterActionConfirmModal from './components/CharacterActionConfirmModal.vue'
import CharacterImportModal from './components/CharacterImportModal.vue'
import CollapsibleSheetSection from './components/CollapsibleSheetSection.vue'
import LevelUpModal from './components/LevelUpModal.vue'
import TableComponentsShowcase from '../table-components/TableComponentsShowcase.vue'
import BestiaryPanel from '../bestiary/components/BestiaryPanel.vue'
import { bestiaryToNpc, type BestiaryEntry } from '../bestiary/types.ts'
import { useCharacterSheet } from './composables/useCharacterSheet'
import type { AbilityKey } from './types/character'
import type { CharacterIdentityPatch } from './types/characterView'
import type { ShortRestResult } from './domain/rest'
import type { CharacterV3SpellLevel } from './types/characterV3'
import { classIconFor } from './data/classIcons.ts'
import { speciesIconFor } from './data/speciesIcons.ts'
import { backgroundIconFor } from './data/backgroundIcons.ts'
import { CHARACTER_TRANSFER_MAX_BYTES, parseCharacterTransfer, readAllStoredCharacters, serializeCharacterTransfer, transferFilename } from './api/characterTransfer.ts'
import { readStoredCharacterV3 } from './api/characterV3Storage.ts'
import './styles/character-sheet.css'

const tabs = [{ name: 'Основное', value: 'main' }, { name: 'Бой', value: 'combat' }, { name: 'Магия / Заклинания', value: 'magic' }, { name: 'Инвентарь', value: 'inventory' }, { name: 'БИО', value: 'bio' }, { name: 'Бестиарий', value: 'bestiary' }, { name: 'Игровые компоненты', value: 'table-components' }] as const
const activeTab = ref<string>('main')
const tabDirection = ref<'forward' | 'backward'>('forward')
const creationOpen = ref(false)
const creationSession = ref(0)
const creationError = ref<string | null>(null)
const transferStatus = ref<{ kind: 'success' | 'error'; text: string } | null>(null)
const printMode = ref(false)
const sheet = useCharacterSheet()
const { open } = useDialog()
const tabIndexes = new Map<string, number>(tabs.map((tab, index) => [tab.value, index]))
watch(activeTab, (next, previous) => {
  tabDirection.value = (tabIndexes.get(next) ?? 0) >= (tabIndexes.get(previous) ?? 0) ? 'forward' : 'backward'
  const scrollPosition = window.scrollY
  void nextTick(() => window.scrollTo({ top: scrollPosition, behavior: 'auto' }))
})
watch(() => sheet.activeId.value, (id) => {
  if (!id) return
  try { activeTab.value = sessionStorage.getItem(`nastolka:sheet:active-tab:${id}`) ?? 'main' } catch { activeTab.value = 'main' }
}, { immediate: true })
watch(activeTab, (tab) => {
  const id = sheet.activeId.value
  if (!id) return
  try { sessionStorage.setItem(`nastolka:sheet:active-tab:${id}`, tab) } catch { /* ignore unavailable session storage */ }
})
function tabPanelClass(tab: string) {
  return { 'sheet-tab-panel-active': activeTab.value === tab, [`sheet-tab-panel-${tabDirection.value}`]: activeTab.value === tab }
}
function downloadJson(filename: string, value: string) {
  const blob = new Blob([value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
async function exportCharacters(all: boolean) {
  transferStatus.value = null
  const activeId = sheet.activeId.value
  if (sheet.isDirty.value || (activeId && readStoredCharacterV3(activeId, window.localStorage) === null)) await sheet.save()
  if (sheet.saveError.value) {
    transferStatus.value = { kind: 'error', text: sheet.saveError.value }
    return
  }
  const stored = all ? readAllStoredCharacters(window.localStorage) : activeId ? [readStoredCharacterV3(activeId, window.localStorage)].filter((value): value is NonNullable<typeof value> => value !== null) : []
  if (!stored.length) {
    transferStatus.value = { kind: 'error', text: 'Нет сохранённых персонажей для экспорта.' }
    return
  }
  const name = all ? 'personazhi' : stored[0]?.identity.name ?? 'personazh'
  downloadJson(transferFilename(name), serializeCharacterTransfer(stored))
  transferStatus.value = { kind: 'success', text: all ? `Экспортировано персонажей: ${stored.length}.` : 'Персонаж экспортирован.' }
}
function openImportPreview(plan: ReturnType<typeof parseCharacterTransfer>) {
  open({ component: CharacterImportModal, componentProps: {
    characters: plan.characters,
    currentAvailable: Boolean(sheet.character.value),
    onImport: async (mode: 'add' | 'replace') => {
      try {
        await sheet.importCharacters(plan.characters, mode)
        transferStatus.value = { kind: 'success', text: `Импортировано персонажей: ${plan.characters.length}.` }
      } catch (error) {
        transferStatus.value = { kind: 'error', text: error instanceof Error ? error.message : 'Не удалось импортировать персонажей.' }
        throw error
      }
    },
  } })
}
async function importFile(file: File) {
  transferStatus.value = null
  if (file.size > CHARACTER_TRANSFER_MAX_BYTES) {
    transferStatus.value = { kind: 'error', text: 'Файл импорта слишком большой.' }
    return
  }
  try {
    const plan = parseCharacterTransfer(await file.text())
    const showPreview = () => openImportPreview(plan)
    if (sheet.isDirty.value) {
      openActionConfirm('Импортировать персонажа?', 'Есть несохранённые изменения. Перед импортом они будут отменены, если вы продолжите.', 'Продолжить', showPreview)
    } else showPreview()
  } catch (error) {
    transferStatus.value = { kind: 'error', text: error instanceof Error ? error.message : 'Не удалось прочитать файл импорта.' }
  }
}
function startPrint() {
  printMode.value = true
  void nextTick(() => window.print())
}
function finishPrint() { printMode.value = false }
function updateAbility(key: AbilityKey, value: number) { sheet.updateAbility(key, value) }
function applyCreation(payload: Parameters<typeof sheet.applyCreation>[0]) {
  try {
    sheet.applyCreation(payload)
    creationError.value = null
  } catch (error) {
    creationError.value = error instanceof Error ? error.message : 'Не удалось создать персонажа.'
  }
}
function closeCreation() { creationOpen.value = false; activeTab.value = 'main' }
function openCreationModal() { if (sheet.character.value) { creationSession.value += 1; creationError.value = null; creationOpen.value = true } }
function updateIdentity(patch: CharacterIdentityPatch) { sheet.updateIdentity(patch) }
function openIdentityModal() {
  if (!sheet.character.value) return
  open({ component: CharacterIdentityModal, componentProps: { character: sheet.character.value, disabled: sheet.isSaving.value, onUpdate: updateIdentity } })
}
function openLevelUpModal() {
  if (!sheet.character.value || sheet.character.value.level >= 20 || !sheet.character.value.progression?.classLevels.length) return
  open({ component: LevelUpModal, componentProps: { character: sheet.character.value, disabled: sheet.isSaving.value, onConfirm: sheet.levelUp } })
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
async function useSpellSlot(level: CharacterV3SpellLevel, delta: number) {
  sheet.adjustSpellSlot(level, delta)
  await sheet.save()
}
async function useInventoryItem(id: string) {
  if (sheet.useInventoryItem(id)) await sheet.save()
}
function openActionConfirm(title: string, message: string, confirmLabel: string, action: () => void | Promise<void>, danger = false) {
  open({ component: CharacterActionConfirmModal, componentProps: { title, message, confirmLabel, danger, onConfirm: action } })
}
function selectCharacter(id: string) {
  if (id === sheet.activeId.value) return
  if (sheet.isDirty.value) {
    openActionConfirm('Переключить персонажа?', 'Есть несохранённые изменения. При переключении они будут отменены.', 'Переключить', () => sheet.selectCharacter(id))
    return
  }
  void sheet.selectCharacter(id)
}
function createCharacter() {
  if (sheet.isDirty.value) {
    openActionConfirm('Создать нового персонажа?', 'Есть несохранённые изменения. При создании нового персонажа они будут отменены.', 'Создать', async () => { await sheet.createCharacter() })
    return
  }
  void sheet.createCharacter()
}
function createNpcCharacter() {
  if (sheet.isDirty.value) {
    openActionConfirm('Создать НПС?', 'Есть несохранённые изменения. При создании нового НПС они будут отменены.', 'Создать', async () => { await sheet.createNpc() })
    return
  }
  void sheet.createNpc()
}
function createNpcFromBestiary(entry: BestiaryEntry) {
  const create = async () => {
    await sheet.createNpcFromProfile(bestiaryToNpc(entry))
    activeTab.value = 'main'
  }
  if (sheet.isDirty.value) {
    openActionConfirm('Создать НПС из бестиария?', 'Есть несохранённые изменения. При создании отдельной копии они будут отменены.', 'Создать НПС', create)
    return
  }
  void create()
}
function copyCharacter() {
  if (sheet.isDirty.value) {
    openActionConfirm('Скопировать персонажа?', 'Есть несохранённые изменения. При копировании они будут сохранены в новой копии.', 'Копировать', async () => { await sheet.copyCharacter() })
    return
  }
  void sheet.copyCharacter()
}
function deleteCharacter() {
  const message = sheet.isDirty.value
    ? 'Есть несохранённые изменения. Удаление персонажа отменит их и удалит сохранённые данные.'
    : 'Персонаж и его сохранённые данные будут удалены без возможности восстановления.'
  openActionConfirm('Удалить персонажа?', message, 'Удалить', () => sheet.deleteCharacter(), true)
}
const selectedClassIcon = computed(() => classIconFor(sheet.character.value?.creation?.classId ?? sheet.character.value?.class ?? '', sheet.character.value?.creation?.gender ?? 'female'))
const selectedSpeciesIcon = computed(() => sheet.character.value?.ruleset === '2024' ? speciesIconFor(sheet.character.value.creation?.speciesId ?? sheet.character.value.race.name) : undefined)
const selectedBackgroundIcon = computed(() => backgroundIconFor(sheet.character.value?.creation?.backgroundId ?? sheet.character.value?.origin.background ?? sheet.character.value?.background.name))
onMounted(() => window.addEventListener('afterprint', finishPrint))
onBeforeUnmount(() => window.removeEventListener('afterprint', finishPrint))
</script>
<template>
  <main class="character-sheet" :class="{ 'character-sheet-creation-mode': creationOpen, 'character-sheet-print-mode': printMode }">
    <CharacterLoadState :loading="sheet.isLoading.value" :error="sheet.loadError.value" @retry="sheet.load" />
    <template v-if="!sheet.isLoading.value && !sheet.loadError.value">
      <CharacterManagerBar :characters="sheet.characters.value" :active-id="sheet.activeId.value" :dirty="sheet.isDirty.value" :disabled="sheet.isSaving.value" :status="transferStatus" @select="selectCharacter" @create="createCharacter" @create-npc="createNpcCharacter" @copy="copyCharacter" @remove="deleteCharacter" @export-current="exportCharacters(false)" @export-all="exportCharacters(true)" @import-file="importFile" />
      <section v-if="!sheet.character.value" class="character-empty-state sheet-section" aria-live="polite">
        <h1>Персонажи не найдены</h1>
        <p>Создайте нового персонажа, чтобы начать работу с листом.</p>
        <CBtn color-type="primary" @click="createCharacter">Создать персонажа</CBtn>
      </section>
    </template>
    <template v-if="sheet.character.value && !sheet.isLoading.value && !sheet.loadError.value">
      <section v-if="creationOpen" class="character-creation-root" aria-label="Создание персонажа">
        <CharacterCreationTab :key="creationSession" :character="sheet.character.value" :disabled="sheet.isSaving.value" :creation-error="creationError" hide-preview
          @create="applyCreation" @back-to-sheet="closeCreation" />
      </section>
      <template v-else>
        <NpcSheetPanel v-if="sheet.character.value.kind === 'npc'" :character="sheet.character.value" :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value" :saved="sheet.savedNotice.value" :save-error="sheet.saveError.value" :on-save="sheet.save" :on-print="startPrint" @update="sheet.updateNpc" />
        <template v-else>
        <CharacterSheetHeader :name="sheet.character.value.name"
          :race="sheet.character.value.race.name" :species-icon="selectedSpeciesIcon" :class-name="sheet.character.value.class" :class-icon="selectedClassIcon"
          :background-name="sheet.character.value.background.name || sheet.character.value.origin.background" :background-icon="selectedBackgroundIcon"
          :ruleset="sheet.character.value.ruleset"
          :level="sheet.character.value.level" :experience="sheet.character.value.experience"
          :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value" :saved="sheet.savedNotice.value"
          :save-error="sheet.saveError.value" @save="sheet.save" @open-details="openIdentityModal" @print="startPrint" />
        <div class="sheet-tabs-row">
          <div class="sheet-tabs"><CTabs v-model="activeTab" :tabs="tabs" id-prefix="sheet-tab-panel" /></div>
          <CBtn class="creation-launch-button" color-type="accent" :disabled="sheet.isSaving.value" @click="openCreationModal">Создание персонажа</CBtn>
        </div>
        <div class="sheet-tab-stage">
          <div id="sheet-tab-panel-main" v-show="printMode || activeTab === 'main'" class="sheet-tab-panel" :class="tabPanelClass('main')">
            <CollapsibleSheetSection title="Основное" id="main-section" :storage-key="sheet.activeId.value ?? 'empty'" :force-open="printMode || Boolean(sheet.saveError.value || transferStatus?.kind === 'error')">
              <CharacterMainTab :character="sheet.character.value"
                :disabled="sheet.isSaving.value" @update:saving-throw="sheet.updateSavingThrow"
                @update:ability="updateAbility" @update:skill="sheet.updateSkill" @update:feats="sheet.updateFeats" @level-up="openLevelUpModal" />
            </CollapsibleSheetSection>
          </div>
          <div id="sheet-tab-panel-combat" v-show="printMode || activeTab === 'combat'" class="sheet-tab-panel" :class="tabPanelClass('combat')">
            <CollapsibleSheetSection title="Бой" id="combat-section" :storage-key="sheet.activeId.value ?? 'empty'" :force-open="printMode || Boolean(sheet.saveError.value || transferStatus?.kind === 'error')">
              <CharacterCombatTab :character="sheet.character.value" :disabled="sheet.isSaving.value"
                :on-short-rest="takeShortRest" :on-long-rest="takeLongRest"
                @update:combat="sheet.updateCombat" @update:attacks="sheet.updateAttacks" />
            </CollapsibleSheetSection>
          </div>
          <div id="sheet-tab-panel-magic" v-show="printMode || activeTab === 'magic'" class="sheet-tab-panel" :class="tabPanelClass('magic')">
            <CollapsibleSheetSection title="Магия и заклинания" id="magic-section" :storage-key="sheet.activeId.value ?? 'empty'" :force-open="printMode || Boolean(sheet.saveError.value || transferStatus?.kind === 'error')">
              <CharacterMagicTab :character="sheet.character.value"
                :disabled="sheet.isSaving.value" @update:spells="sheet.updateSpells" @update:cantrips="sheet.updateCantrips" @update:spellcasting="sheet.updateSpellcasting" @use-slot="useSpellSlot" />
            </CollapsibleSheetSection>
          </div>
          <div id="sheet-tab-panel-inventory" v-show="printMode || activeTab === 'inventory'" class="sheet-tab-panel" :class="tabPanelClass('inventory')">
            <CollapsibleSheetSection title="Инвентарь" id="inventory-section" :storage-key="sheet.activeId.value ?? 'empty'" :force-open="printMode || Boolean(sheet.saveError.value || transferStatus?.kind === 'error')">
              <CharacterInventoryTab :character="sheet.character.value"
                :disabled="sheet.isSaving.value" @update:inventory="sheet.updateInventory" @update:money="sheet.updateMoney" @use-item="useInventoryItem" />
            </CollapsibleSheetSection>
          </div>
          <div id="sheet-tab-panel-bio" v-show="printMode || activeTab === 'bio'" class="sheet-tab-panel" :class="tabPanelClass('bio')">
            <CollapsibleSheetSection title="Биография" id="bio-section" :storage-key="sheet.activeId.value ?? 'empty'" :force-open="printMode || Boolean(sheet.saveError.value || transferStatus?.kind === 'error')">
              <CharacterBioTab :personality="sheet.character.value.personality" :disabled="sheet.isSaving.value"
                @update="sheet.updatePersonality" />
            </CollapsibleSheetSection>
          </div>
          <div v-show="!printMode && activeTab === 'table-components'" class="sheet-tab-panel table-components-panel" :class="tabPanelClass('table-components')">
            <TableComponentsShowcase />
          </div>
          <div v-show="!printMode && activeTab === 'bestiary'" class="sheet-tab-panel bestiary-tab-panel" :class="tabPanelClass('bestiary')">
            <BestiaryPanel :on-create-npc="createNpcFromBestiary" @status="(message) => { transferStatus = { kind: 'success', text: message } }" />
          </div>
        </div>
        </template>
      </template>
    </template>
  </main>
</template>
