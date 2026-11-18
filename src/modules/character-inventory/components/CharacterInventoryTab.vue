<script setup lang="ts">
import InventoryList from './InventoryList.vue'
import MoneyFields from './MoneyFields.vue'
import { NCollapse, NCollapseItem } from 'naive-ui';
</script>

<template>
    <NCollapse>
        <NCollapseItem name="InventoryList" title="Инвентарь">
            <InventoryList />
        </NCollapseItem>
        <NCollapseItem name="MoneyFields" title="Финансы">
            <MoneyFields />
        </NCollapseItem>
    </NCollapse>
</template>
