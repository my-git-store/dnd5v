<script setup lang="ts">
import { ref } from 'vue'

import SpellList from './SpellList.vue'
import SpellcastingSummary from './SpellcastingSummary.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'
import type { CharacterSpell } from '@/types/character'
import type { CharacterSheetView } from '@/types/characterView'
import type { CharacterSpellLevel } from '@/types/character'

type Emits = {
    'update:spells': [spells: CharacterSpell[]]
    'update:cantrips': [spells: CharacterSpell[]]
    'update:spellcasting': [spellcasting: CharacterSheetView['spellcasting']]
    'use-slot': [level: CharacterSpellLevel, delta: number]
}

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean }>()

const emit = defineEmits<Emits>()

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
    <div class="c-tab-content magic-tab">
        <section class="magic-intro-panel">
            <div class="magic-intro-mark" aria-hidden="true">✦</div>
            <h1>Магия и заклинания</h1>
        </section>
        <SpellcastingSummary :spellcasting="character.spellcasting" :abilities="character.abilities"
            :level="character.level" :disabled="disabled" @update="emit('update:spellcasting', $event)" />
        <SpellSlotsFields :slots="character.spellcasting.spellSlots" :disabled="disabled" @update="updateSlots"
            @use-slot="useSlot" />
        <section class="magic-spellbook-shell">
            <NTabs v-model:value="activeSpellbookTab" type="line">
                <NTab v-for="tab in spellbookTabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
            </NTabs>
            <div class="magic-spellbook-panels">
                <div v-show="activeSpellbookTab === 'cantrips'" id="spellbook-tab-cantrips"
                    class="magic-spellbook-panel">
                    <SpellList title="Заговоры" :spells="character.cantrips" cantrip :disabled="disabled"
                        @update="emit('update:cantrips', $event)" />
                </div>
                <div v-show="activeSpellbookTab === 'spells'" id="spellbook-tab-spells" class="magic-spellbook-panel">
                    <SpellList title="Заклинания" :spells="character.spells"
                        :prepared-ids="character.spellcasting.preparedSpellIds" show-prepared-filter
                        :disabled="disabled" @update="emit('update:spells', $event)"
                        @update:prepared-ids="updatePrepared" />
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.magic-tab {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
}

.magic-tab>section:nth-child(-n + 2) {
    grid-column: 1 / -1;
}

.magic-intro-panel {
    display: flex;
    align-items: center;
    gap: 14px;
    grid-column: 1 / -1;
    background: linear-gradient(135deg, rgba(255, 250, 239, 0.96), rgba(244, 226, 194, 0.76));
}

.magic-intro-mark {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border: 1px solid #c6a56c;
    border-radius: 12px 12px 12px 3px;
    background: #fff3d8;
    color: #8c5e2b;
    font-size: 1.25rem;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.48);
}

.magic-intro-panel h1 {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1.35rem;
}

.magic-intro-panel :deep(.c-eyebrow) {
    margin-bottom: 4px;
    font-size: 0.62rem;
}

.magic-tab>section:nth-child(2),
.magic-tab>section:nth-child(3) {
    grid-column: 1 / -1;
}

.magic-tab> :deep(.spellbook-section) {
    min-height: 100%;
}

.magic-spellbook-shell {
    grid-column: 1 / -1;
}

.magic-spellbook-panels {
    min-width: 0;
}

.magic-spellbook-panel> :deep(.spellbook-section) {
    min-height: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
}

.magic-spellbook-panel> :deep(.spellbook-section::before) {
    display: none;
}

.magic-intro-mark {
    border-color: #bd9a61;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.5),
        0 2px 5px rgba(83, 59, 38, 0.06);
}

.magic-intro-panel {
    border-color: #c4a474;
    background: linear-gradient(135deg, rgba(255, 250, 239, 0.94), rgba(243, 224, 190, 0.78));
}

.magic-intro-panel h1 {
    color: var(--sheet-burgundy);
}
</style>
