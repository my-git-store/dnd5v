<script setup lang="ts">
import { ref } from 'vue'
import { NTab, NTabs } from 'naive-ui'

import SpellList from './SpellList.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'

const spellbookTabs = [
    { name: 'Заговоры', value: 'cantrips' },
    { name: 'Заклинания', value: 'spells' },
] as const

const activeSpellbookTab = ref<(typeof spellbookTabs)[number]['value']>('cantrips')
</script>

<template>
    <div class="grid gap-4">
        <SpellSlotsFields />
        <section>
            <NTabs v-model:value="activeSpellbookTab" type="line">
                <NTab v-for="tab in spellbookTabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
            </NTabs>
            <div>
                <div v-if="activeSpellbookTab === 'cantrips'" id="spellbook-tab-cantrips">
                    <SpellList title="Заговоры" cantrip />
                </div>
                <div v-if="activeSpellbookTab === 'spells'" id="spellbook-tab-spells">
                    <SpellList title="Заклинания" show-prepared-filter />
                </div>
            </div>
        </section>
    </div>
</template>
