<script setup lang="ts">
import { ref } from 'vue'
import { NTab, NTabs } from 'naive-ui'

import SpellList from './SpellList.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'
import { useCharacterMagic } from '../composables/useCharacterMagic'
import type { Character } from '@/types/character'
import type { CharacterSpellLevel } from '@/types/character'

type Emits = {
    'use-slot': [level: CharacterSpellLevel, delta: number]
}

const props = defineProps<{ character: Character; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const { updateSpells, updateCantrips, updateSpellcasting } = useCharacterMagic()

const spellbookTabs = [
    { name: 'Заговоры', value: 'cantrips' },
    { name: 'Заклинания', value: 'spells' },
] as const

const activeSpellbookTab = ref<(typeof spellbookTabs)[number]['value']>('cantrips')

function updateSlots(spellSlots: Character['spellcasting']['spellSlots']) {
    updateSpellcasting({ ...props.character.spellcasting, spellSlots })
}
function updatePrepared(preparedSpellIds: string[]) {
    updateSpellcasting({ ...props.character.spellcasting, preparedSpellIds })
}
function useSlot(level: CharacterSpellLevel, delta: number) {
    emit('use-slot', level, delta)
}
</script>

<template>
    <div class="grid gap-4">
        <SpellSlotsFields :slots="character.spellcasting.spellSlots" :disabled="disabled" @update="updateSlots"
            @use-slot="useSlot" />
        <section>
            <NTabs v-model:value="activeSpellbookTab" type="line">
                <NTab v-for="tab in spellbookTabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
            </NTabs>
            <div>
                <div v-show="activeSpellbookTab === 'cantrips'" id="spellbook-tab-cantrips">
                    <SpellList title="Заговоры" :spells="character.spellcasting.cantrips" cantrip :disabled="disabled"
                        @update="updateCantrips" />
                </div>
                <div v-show="activeSpellbookTab === 'spells'" id="spellbook-tab-spells">
                    <SpellList title="Заклинания" :spells="character.spellcasting.knownSpells"
                        :prepared-ids="character.spellcasting.preparedSpellIds" show-prepared-filter
                        :disabled="disabled" @update="updateSpells"
                        @update:prepared-ids="updatePrepared" />
                </div>
            </div>
        </section>
    </div>
</template>
