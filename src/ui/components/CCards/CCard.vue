<script setup lang="ts">
type Slots = {
    title: any,
    default: any
}

const slots = defineSlots<Slots>()
</script>

<template>
    <div class="c-card c-flex-col p-4 rounded-2xl border-accent border-[1px]">
        <div class="c-card-title" v-if="slots.title">
            <slot name="title" />
        </div>
        <div class="c-flex-col c-card-desc" v-if="slots.default">
            <slot name="default" />
        </div>
    </div>
</template>

<style scoped>
@import url('./CCard.css');
</style>