<script setup lang="ts">
import { NCollapse, NCollapseItem } from 'naive-ui'

import CantripList from '@/modules/character-cantrips/components/CantripList.vue'
import SpellList from '@/modules/character-spells/components/SpellList.vue'
import SpellSlotsFields from './SpellSlotsFields.vue'
</script>

<template>
    <NCollapse>
        <NCollapseItem name="SpellSlotsFields" title="Ячейки заклинаний">
            <SpellSlotsFields />
        </NCollapseItem>
        <NCollapseItem name="CantripList" title="Заговоры">
            <CantripList />
        </NCollapseItem>
        <NCollapseItem name="SpellList" title="Заклинания">
            <SpellList />
        </NCollapseItem>
    </NCollapse>
</template>
