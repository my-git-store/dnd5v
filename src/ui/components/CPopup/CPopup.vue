<script setup lang="ts">
import { onClickOutside, useParentElement } from '@vueuse/core';
import { ref, onMounted, computed, onUnmounted, useTemplateRef } from 'vue';

const parent = useParentElement()
const popupRef = useTemplateRef('popupRef')

const isOpen = ref(false)

const parentPositions = computed(() => {
    if (!parent.value)
        return {
            left: '0px',
            top: '0px'
        }
    const el = parent.value.getBoundingClientRect()
    return {
        left: `${el.left}px`,
        top: `${el.top + el.height}px`
    }
})

function setPopupEvents() {
    if (!parent.value)
        return
    parent.value.addEventListener('click', (evt) => {
        const target = evt.target
        if (target instanceof HTMLElement && target.id === 'popup')
            isOpen.value = false
        else
            isOpen.value = true
    })
}
function deletePopupEvents() {
    parent.value?.removeEventListener('click', () => { })
}

onClickOutside(popupRef, () => {
    isOpen.value = false
})

onMounted(() => {
    setPopupEvents()
})
onUnmounted(() => {
    deletePopupEvents()
})
</script>

<template>
    <div class="c-popup-container" id="popup" v-if="isOpen && parent">
        <div ref="popupRef" class="c-popup" :style="{ left: parentPositions.left, top: parentPositions.top }">
            <slot name="default" />
        </div>
    </div>
</template>

<style scoped>
.c-popup-container {
    z-index: 6000;
    position: fixed !important;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    pointer-events: none;
}

.c-popup {
    visibility: visible;
    position: absolute;
    pointer-events: all;
}
</style>
