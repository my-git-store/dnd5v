<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Icon } from '@iconify/vue';

const windowTop = ref(0)

function onScroll() {
    windowTop.value = window.scrollY
}

function setWindowScroolIntoNull() {
    window.scrollTo({
        behavior: 'smooth',
        top: 0
    })
}

onMounted(() => window.addEventListener("scroll", onScroll))
onUnmounted(() => window.removeEventListener("scroll", onScroll))
</script>

<template>
    <div v-if="windowTop != 0" @click="setWindowScroolIntoNull"
        class="w-10 h-10 rounded-full border border-[#d4c4b5] flex items-center justify-center text-[#8b7355] hover:text-primary-1000 hover:border-[#8b7355] hover:bg-[#f5e6d3] transition-all bg-white shadow-sm">
        <Icon icon="ci:arrow-up-lg" class="text-xl" />
    </div>
</template>
