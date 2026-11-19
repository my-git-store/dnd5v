<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NAlert, NTab, NTabs, } from 'naive-ui'

import { useMonsterSheet } from '../composables/useMonsterSheet'
import MonsterCombatTab from '../modules/monster-combat/MonsterCombatTab.vue'
import IdentityFields from '../modules/monster-identity/components/IdentityFields.vue'
import MonsterDetailsTab from '../modules/monster-identity/components/MonsterDetailsTab.vue'
import MonsterMainTab from '../modules/monster-main/components/MonsterMainTab.vue'

const tabs = [
    { name: 'Основное', value: 'main' },
    { name: 'Бой', value: 'combat' },
    { name: 'Описание', value: 'details' },
] as const

const activeTab = ref('main')

const { monster, isLoading, loadError, saveError, load } =
    useMonsterSheet()

onMounted(() => load())
</script>

<template>
    <main class="p-6">
        <template v-if="!isLoading && !loadError">
            <div v-if="monster" class="flex flex-col gap-4">
                <NAlert v-if="saveError" type="error" role="alert" title="Ошибка сохранения">
                    {{ saveError }}
                </NAlert>
                <IdentityFields />
                <NTabs v-model:value="activeTab" type="line">
                    <NTab v-for="tab in tabs" :key="tab.value" :name="tab.value" :tab="tab.name" />
                </NTabs>
                <MonsterMainTab v-if="activeTab === 'main'" />
                <MonsterCombatTab v-if="activeTab === 'combat'" />
                <MonsterDetailsTab v-if="activeTab === 'details'" />
            </div>
        </template>
    </main>
</template>
