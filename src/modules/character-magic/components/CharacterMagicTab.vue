<script setup lang="ts">
import { NCollapse, NCollapseItem } from 'naive-ui';
import SpellList from './SpellList.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'
</script>

<template>
    <NCollapse>
        <NCollapseItem name="SpellSlotsFields" title="Ячейки заклинаний">
            <SpellSlotsFields />
        </NCollapseItem>
        <NCollapseItem name="SpellList" title="Заговоры">
            <SpellList title="Заговоры" cantrip />
        </NCollapseItem>
        <NCollapseItem name="SpellList2" title="Заклинания">
            <SpellList title="Заклинания" show-prepared-filter />
        </NCollapseItem>
    </NCollapse>
</template>
