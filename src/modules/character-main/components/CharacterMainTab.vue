<script setup lang="ts">
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import CharacterFeatList from '@/modules/character-feats/components/CharacterFeatList.vue'
import { NCollapse, NCollapseItem } from 'naive-ui'
</script>

<template>
    <NCollapse>
        <NCollapseItem name="AbilityFields" title="Характеристики">
            <AbilityFields />
        </NCollapseItem>
        <NCollapseItem name="SkillFields" title="Навыки">
            <SkillFields />
        </NCollapseItem>
        <NCollapseItem name="CharacterFeatList" title="Черты и особенности">
            <CharacterFeatList />
        </NCollapseItem>
    </NCollapse>
</template>
