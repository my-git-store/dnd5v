<script setup lang="ts">
import { Icon } from '@iconify/vue';
</script>

<template>
    <div class="relative h-full w-full flex items-center justify-center">
        <div class="w-24 h-24 border-4 border-[#f5e6d3] rounded-full"></div>
        <div class="w-24 h-24 border-t-4 border-[#8b7355] rounded-full absolute animate-spin-slow"></div>
        <Icon icon="fa6-solid:chess-knight" class="text-2xl text-[#8b7355] absolute" />
    </div>
</template>

<style scoped>
.animate-spin-slow {
    animation: spin-slow 1.5s linear infinite;
}

@keyframes spin-slow {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>