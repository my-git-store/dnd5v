<script setup lang="ts">
import { NCollapse, NCollapseItem } from 'naive-ui'

import { useMonsterSheet } from '../../../composables/useMonsterSheet'
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'

const { monster } = useMonsterSheet()
</script>

<template>
    <NCollapse v-if="monster">
        <NCollapseItem name="AbilityFields" title="Характеристики">
            <AbilityFields />
        </NCollapseItem>
        <NCollapseItem name="SkillFields" title="Навыки">
            <SkillFields />
        </NCollapseItem>
    </NCollapse>
</template>
