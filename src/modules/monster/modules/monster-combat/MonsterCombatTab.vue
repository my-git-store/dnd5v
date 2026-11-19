<script setup lang="ts">
import { NFormItem, NInput, NInputNumber } from 'naive-ui'

import { useMonsterSheet } from '../../composables/useMonsterSheet'
import { MONSTER_COMBAT_NUMBER_FIELDS, MONSTER_COMBAT_TEXT_FIELDS } from '../../data/monsterFields'
import AttackList from './components/AttackList.vue'

const { monster } = useMonsterSheet()
</script>

<template>
    <section
        v-if="monster"
        aria-label="Боевые параметры"
        class="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3"
    >
        <NFormItem
            v-for="field in MONSTER_COMBAT_NUMBER_FIELDS"
            :key="field.key"
            :label="field.label"
        >
            <NInputNumber
                :value="monster[field.key]"
                :input-props="{ 'aria-label': field.label }"
                @update:value="monster[field.key] = $event ?? 0"
            />
        </NFormItem>
        <NFormItem
            v-for="field in MONSTER_COMBAT_TEXT_FIELDS"
            :key="field.key"
            :label="field.label"
        >
            <NInput
                v-model:value="monster[field.key]"
                :input-props="{ 'aria-label': field.label }"
            />
        </NFormItem>
    </section>
    <AttackList class="mt-6" />
</template>
