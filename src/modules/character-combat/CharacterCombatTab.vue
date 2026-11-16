<script setup lang="ts">
import CombatStatsFields from './components/CombatStatsFields.vue'
import AttackList from './components/AttackList.vue';
import { NCollapse, NCollapseItem } from 'naive-ui';
</script>

<template>
    <NCollapse>
        <NCollapseItem name="CombatStatsFields" title="Основное">
            <CombatStatsFields />
        </NCollapseItem>
        <NCollapseItem name="AttackList" title="Атаки">
            <AttackList />
        </NCollapseItem>
    </NCollapse>
</template>
