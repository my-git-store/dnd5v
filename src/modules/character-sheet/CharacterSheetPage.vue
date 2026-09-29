<script setup lang="ts">
import { ref } from 'vue'
import { CTabs } from '@/ui/components'
import CharacterSheetHeader from './components/CharacterSheetHeader.vue'
import CharacterLoadState from './components/CharacterLoadState.vue'
import CharacterMainTab from './components/CharacterMainTab.vue'
import CharacterMagicTab from './components/CharacterMagicTab.vue'
import CharacterInventoryTab from './components/CharacterInventoryTab.vue'
import CharacterBioTab from './components/CharacterBioTab.vue'
import { useCharacterSheet } from './composables/useCharacterSheet'
import type { AbilityKey } from './types/character'
import './styles/character-sheet.css'

const tabs = [{ name: 'Основное', value: 'main' }, { name: 'Магия / Заклинания', value: 'magic' }, { name: 'Инвентарь', value: 'inventory' }, { name: 'БИО', value: 'bio' }] as const
const activeTab = ref<string>('main')
const sheet = useCharacterSheet()
function updateAbility(key: AbilityKey, value: number) { sheet.updateAbility(key, value) }
</script>
<template>
  <main class="character-sheet">
    <CharacterLoadState :loading="sheet.isLoading.value" :error="sheet.loadError.value" @retry="sheet.load" />
    <template v-if="sheet.character.value && !sheet.isLoading.value && !sheet.loadError.value">
      <CharacterSheetHeader :name="sheet.character.value.name" @update:name="sheet.updateName"
        :dirty="sheet.isDirty.value" :saving="sheet.isSaving.value" :saved="sheet.savedNotice.value"
        :save-error="sheet.saveError.value" @save="sheet.save" />
      <CTabs v-model="activeTab" :tabs="tabs" />
      <CharacterMainTab v-show="activeTab === 'main'" :character="sheet.character.value"
        :disabled="sheet.isSaving.value" @update:ability="updateAbility" @update:skill="sheet.updateSkill"
        @update:attacks="sheet.updateAttacks" />
      <CharacterMagicTab v-show="activeTab === 'magic'" :character="sheet.character.value"
        :disabled="sheet.isSaving.value" @update:spells="sheet.updateSpells" @update:cantrips="sheet.updateCantrips" />
      <CharacterInventoryTab v-show="activeTab === 'inventory'" :character="sheet.character.value"
        :disabled="sheet.isSaving.value" @update:inventory="sheet.updateInventory" @update:money="sheet.updateMoney" />
      <CharacterBioTab v-show="activeTab === 'bio'" :bio="sheet.character.value.bio" :disabled="sheet.isSaving.value"
        @update="sheet.updateBio" />
    </template>
  </main>
</template>
