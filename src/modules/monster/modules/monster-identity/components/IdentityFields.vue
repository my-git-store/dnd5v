<script setup lang="ts">
import { NCheckbox, NFormItem, NInput, NInputNumber } from 'naive-ui'

import { useMonsterSheet } from '../../../composables/useMonsterSheet'
import { MONSTER_IDENTITY_FIELDS } from '../../../data/monsterFields'

const { monster } = useMonsterSheet()
</script>

<template>
    <section v-if="monster" aria-label="Основные сведения" class="grid gap-x-4 sm:grid-cols-2">
        <NFormItem v-for="field in MONSTER_IDENTITY_FIELDS" :key="field.key" :label="field.label">
            <NInput
                v-model:value="monster[field.key]"
                :input-props="{ 'aria-label': field.label }"
            />
        </NFormItem>
        <NFormItem label="Опыт">
            <NInputNumber
                :value="monster.experience"
                :min="0"
                :input-props="{ 'aria-label': 'Опыт' }"
                @update:value="monster.experience = $event ?? 0"
            />
        </NFormItem>
        <NFormItem>
            <NCheckbox v-model:checked="monster.leader">Лидер</NCheckbox>
        </NFormItem>
    </section>
</template>
