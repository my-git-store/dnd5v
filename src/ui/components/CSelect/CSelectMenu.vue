<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef } from 'vue'

type Emit = {
    close: []
}
const emit = defineEmits<Emit>()

const dropdownRef = useTemplateRef('dropdownRef')

onClickOutside(dropdownRef, () => {
    emit('close')
})
</script>

<template>
    <div class="c-fade-in absolute z-10 rounded-lg bg-white left-0 right-0 p-2 c-select-menu" ref="dropdownRef">
        <slot name="default" />
    </div>
</template>

<style scoped>
.c-select-menu {
    border: 1px solid var(--color-stone-200);
}
</style>