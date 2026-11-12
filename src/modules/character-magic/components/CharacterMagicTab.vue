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
    <div class="grid gap-4">
        <section>
            <div aria-hidden="true">✦</div>
            <h1>Магия и заклинания</h1>
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
        <section>
            <NTabs v-model:value="activeSpellbookTab" type="line">
                <NTab
                    v-for="tab in spellbookTabs"
                    :key="tab.value"
                    :name="tab.value"
                    :tab="tab.name"
                />
            </NTabs>
            <div>
                <div v-show="activeSpellbookTab === 'cantrips'" id="spellbook-tab-cantrips">
                    <SpellList
                        title="Заговоры"
                        :spells="character.cantrips"
                        cantrip
                        :disabled="disabled"
                        @update="emit('update:cantrips', $event)"
                    />
                </div>
                <div v-show="activeSpellbookTab === 'spells'" id="spellbook-tab-spells">
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
