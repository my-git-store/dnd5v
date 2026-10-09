<script setup lang="ts">
import { ref, watch } from 'vue'
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
import { useCharacterSheet } from './composables/useCharacterSheet'
import type { AbilityKey } from './types/character'
import type { CharacterIdentityPatch } from './types/characterView'
import './styles/character-sheet.css'

const tabs = [{ name: 'Основное', value: 'main' }, { name: 'Бой', value: 'combat' }, { name: 'Магия / Заклинания', value: 'magic' }, { name: 'Инвентарь', value: 'inventory' }, { name: 'БИО', value: 'bio' }] as const
const activeTab = ref<string>('main')
const tabDirection = ref<'forward' | 'backward'>('forward')
const creationOpen = ref(false)
const sheet = useCharacterSheet()
const { open } = useDialog()
const tabIndexes = new Map<string, number>(tabs.map((tab, index) => [tab.value, index]))
watch(activeTab, (next, previous) => {
  tabDirection.value = (tabIndexes.get(next) ?? 0) >= (tabIndexes.get(previous) ?? 0) ? 'forward' : 'backward'
})
function tabPanelClass(tab: string) {
  return { 'sheet-tab-panel-active': activeTab.value === tab, [`sheet-tab-panel-${tabDirection.value}`]: activeTab.value === tab }
}
function updateAbility(key: AbilityKey, value: number) { sheet.updateAbility(key, value) }
function applyCreation(payload: Parameters<typeof sheet.applyCreation>[0]) { sheet.applyCreation(payload) }
function closeCreation() { creationOpen.value = false; activeTab.value = 'main' }
function openCreationModal() { if (sheet.character.value) creationOpen.value = true }
function updateIdentity(patch: CharacterIdentityPatch) { sheet.updateIdentity(patch) }
function openIdentityModal() {
  if (!sheet.character.value) return
  open({ component: CharacterIdentityModal, componentProps: { character: sheet.character.value, disabled: sheet.isSaving.value, onUpdate: updateIdentity } })
}
</script>
<template>
  <main class="character-sheet" :class="{ 'character-sheet-creation-mode': creationOpen }">
    <CharacterLoadState :loading="sheet.isLoading.value" :error="sheet.loadError.value" @retry="sheet.load" />
    <template v-if="sheet.character.value && !sheet.isLoading.value && !sheet.loadError.value">
      <section v-if="creationOpen" class="character-creation-root" aria-label="Создание персонажа">
        <CharacterCreationTab :character="sheet.character.value" :disabled="sheet.isSaving.value" hide-preview
          @create="applyCreation" @back-to-sheet="closeCreation" />
      </section>
      <template v-else>
        <CharacterSheetHeader :name="sheet.character.value.name" @update:name="sheet.updateName"
          :race="sheet.character.value.race.name" :class-name="sheet.character.value.class"
          :ruleset="sheet.character.value.ruleset"
          :level="sheet.character.value.level" :experience="sheet.character.value.experience"
          :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value" :saved="sheet.savedNotice.value"
          :save-error="sheet.saveError.value" @save="sheet.save" @open-details="openIdentityModal" />
        <div class="sheet-tabs-row">
          <div class="sheet-tabs"><CTabs v-model="activeTab" :tabs="tabs" /></div>
          <CBtn class="creation-launch-button" color-type="accent" :disabled="sheet.isSaving.value" @click="openCreationModal">Создание персонажа</CBtn>
        </div>
        <div class="sheet-tab-stage">
          <div v-show="activeTab === 'main'" class="sheet-tab-panel" :class="tabPanelClass('main')">
            <CharacterMainTab :character="sheet.character.value"
              :disabled="sheet.isSaving.value" @update:saving-throw="sheet.updateSavingThrow"
              @update:ability="updateAbility" @update:skill="sheet.updateSkill" />
          </div>
          <div v-show="activeTab === 'combat'" class="sheet-tab-panel" :class="tabPanelClass('combat')">
            <CharacterCombatTab :character="sheet.character.value" :disabled="sheet.isSaving.value"
              @update:combat="sheet.updateCombat" @update:attacks="sheet.updateAttacks" />
          </div>
          <div v-show="activeTab === 'magic'" class="sheet-tab-panel" :class="tabPanelClass('magic')">
            <CharacterMagicTab :character="sheet.character.value"
              :disabled="sheet.isSaving.value" @update:spells="sheet.updateSpells" @update:cantrips="sheet.updateCantrips" @update:spellcasting="sheet.updateSpellcasting" />
          </div>
          <div v-show="activeTab === 'inventory'" class="sheet-tab-panel" :class="tabPanelClass('inventory')">
            <CharacterInventoryTab :character="sheet.character.value"
              :disabled="sheet.isSaving.value" @update:inventory="sheet.updateInventory" @update:money="sheet.updateMoney" />
          </div>
          <div v-show="activeTab === 'bio'" class="sheet-tab-panel" :class="tabPanelClass('bio')">
            <CharacterBioTab :personality="sheet.character.value.personality" :disabled="sheet.isSaving.value"
              @update="sheet.updatePersonality" />
          </div>
        </div>
      </template>
    </template>
  </main>
</template>
