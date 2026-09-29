<script setup lang="ts">
import { watch } from 'vue'
import { useDialog } from './useDialog';

const { modals, close } = useDialog()

function setOverflow() {
    if (modals.value.length > 0)
        document.body.style.overflow = 'hidden'
    else
        document.body.style.overflow = ''
}

watch(modals.value, () => {
    setOverflow()
})
</script>

<template>
    <div v-if="modals.length !== 0" class="block z-9999 modal-blur fade-in fixed w-full h-full top-0 left-0">
        <component :is="{ ...item.component }" class="modal" @close="close" v-bind="item.componentProps"
            v-for="(item, index) in modals" :key="`modal-window-${index}`" />
    </div>
</template>

<style lang="css" scoped>
.modal-blur {
    backdrop-filter: blur(4px);
    background-color: rgba(30, 20, 15, 0.4);
    overflow: hidden;
}

.fade-in {
    opacity: 1;
    animation-name: fadeInOpacity;
    animation-iteration-count: 1;
    animation-timing-function: ease-in;
    animation-duration: 0.2s;
}

@keyframes fadeInOpacity {
    0% {
        opacity: 0;
    }

    100% {
        opacity: 1;
    }
}

.modal {
    background: transparent;
    border: none;
    outline: none;
    box-shadow: none;
}

.modal:focus,
.modal:focus-visible,
.modal:active {
    outline: none;
    border: none;
    box-shadow: none;
}
</style>