<script setup lang="ts">
import { ref } from 'vue'

import SpellList from './SpellList.vue'
import SpellcastingSummary from './SpellcastingSummary.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'
import type { CharacterSpell } from '@/types/character'
import type { CharacterSheetView } from '@/types/characterView'
import type { CharacterSpellLevel } from '@/types/character'

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean }>()

const emit = defineEmits<{
    'update:spells': [spells: CharacterSpell[]]
    'update:cantrips': [spells: CharacterSpell[]]
    'update:spellcasting': [spellcasting: CharacterSheetView['spellcasting']]
    'use-slot': [level: CharacterSpellLevel, delta: number]
}>()

const spellbookTabs = [
    { name: 'Заговоры', value: 'cantrips' },
    { name: 'Заклинания', value: 'spells' },
] as const

const activeSpellbookTab = ref<(typeof spellbookTabs)[number]['value']>('cantrips')

function updateSlots(spellSlots: CharacterSheetView['spellcasting']['spellSlots']) {
    emit('update:spellcasting', { ...props.character.spellcasting, spellSlots })
}
function updatePrepared(preparedSpellIds: string[]) {
    emit('update:spellcasting', { ...props.character.spellcasting, preparedSpellIds })
}
function useSlot(level: CharacterSpellLevel, delta: number) {
    emit('use-slot', level, delta)
}
</script>

<template>
    <div class="tab-content magic-tab">
        <section class="sheet-section magic-intro-panel">
            <div class="magic-intro-mark" aria-hidden="true">✦</div>
            <div>
                <h1>Магия и заклинания</h1>
                <p class="section-note">
                    Настройте источник магии, следите за ячейками и храните заклинания в одном
                    месте.
                </p>
            </div>
        </section>
        <SpellcastingSummary
            :spellcasting="character.spellcasting"
            :abilities="character.abilities"
            :level="character.level"
            :disabled="disabled"
            @update="emit('update:spellcasting', $event)"
        />
        <SpellSlotsFields
            :slots="character.spellcasting.spellSlots"
            :disabled="disabled"
            @update="updateSlots"
            @use-slot="useSlot"
        />
        <section class="sheet-section magic-spellbook-shell">
            <NTabs v-model:value="activeSpellbookTab" type="line"
                ><NTab
                    v-for="tab in spellbookTabs"
                    :key="tab.value"
                    :name="tab.value"
                    :tab="tab.name"
            /></NTabs>
            <div class="magic-spellbook-panels">
                <div
                    v-show="activeSpellbookTab === 'cantrips'"
                    id="spellbook-tab-cantrips"
                    class="magic-spellbook-panel"
                >
                    <SpellList
                        title="Заговоры"
                        :spells="character.cantrips"
                        cantrip
                        :disabled="disabled"
                        @update="emit('update:cantrips', $event)"
                    />
                </div>
                <div
                    v-show="activeSpellbookTab === 'spells'"
                    id="spellbook-tab-spells"
                    class="magic-spellbook-panel"
                >
                    <SpellList
                        title="Заклинания"
                        :spells="character.spells"
                        :prepared-ids="character.spellcasting.preparedSpellIds"
                        show-prepared-filter
                        :disabled="disabled"
                        @update="emit('update:spells', $event)"
                        @update:prepared-ids="updatePrepared"
                    />
                </div>
            </div>
        </section>
    </div>
</template>
