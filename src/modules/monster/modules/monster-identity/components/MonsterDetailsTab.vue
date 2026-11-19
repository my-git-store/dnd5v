<script setup lang="ts">
import { NFormItem, NInput } from 'naive-ui'

import { useMonsterSheet } from '../../../composables/useMonsterSheet'

const { monster } = useMonsterSheet()
</script>

<template>
    <section v-if="monster" aria-label="Описание" class="flex flex-col gap-4">
        <NFormItem label="Снаряжение">
            <NInput
                v-model:value="monster.equipment"
                type="textarea"
                :rows="3"
                :input-props="{ 'aria-label': 'Снаряжение' }"
            />
        </NFormItem>
        <NFormItem label="Особенности">
            <NInput
                v-model:value="monster.featuresText"
                type="textarea"
                :rows="6"
                :input-props="{ 'aria-label': 'Особенности' }"
            />
        </NFormItem>
    </section>
</template>
