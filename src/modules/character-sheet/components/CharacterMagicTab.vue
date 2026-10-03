<script setup lang="ts">
import SpellList from './SpellList.vue'
import SpellcastingSummary from './SpellcastingSummary.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'
import type { CharacterSpell } from '../types/character'
import type { CharacterSheetView } from '../types/characterView'

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{ 'update:spells': [spells: CharacterSpell[]]; 'update:cantrips': [spells: CharacterSpell[]]; 'update:spellcasting': [spellcasting: CharacterSheetView['spellcasting']] }>()
function updateSlots(spellSlots: CharacterSheetView['spellcasting']['spellSlots']) {
  emit('update:spellcasting', { ...props.character.spellcasting, spellSlots })
}
function updatePrepared(preparedSpellIds: string[]) {
  emit('update:spellcasting', { ...props.character.spellcasting, preparedSpellIds })
}
</script>

<template>
  <div class="tab-content magic-tab">
    <section class="sheet-section magic-intro-panel">
      <div class="magic-intro-mark" aria-hidden="true">✦</div>
      <div><p class="eyebrow">КНИГА ГЕРОЯ</p><h1>Магия и заклинания</h1><p class="section-note">Настройте источник магии, следите за ячейками и храните заклинания в одном месте.</p></div>
    </section>
    <SpellcastingSummary :spellcasting="character.spellcasting" :abilities="character.abilities" :level="character.level" :disabled="disabled" @update="emit('update:spellcasting', $event)" />
    <SpellSlotsFields :slots="character.spellcasting.spellSlots" :disabled="disabled" @update="updateSlots" />
    <SpellList title="Заговоры" :spells="character.cantrips" cantrip :disabled="disabled" @update="emit('update:cantrips', $event)" />
    <SpellList title="Заклинания" :spells="character.spells" :prepared-ids="character.spellcasting.preparedSpellIds" show-prepared-filter :disabled="disabled" @update="emit('update:spells', $event)" @update:prepared-ids="updatePrepared" />
  </div>
</template>
