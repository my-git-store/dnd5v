<script setup lang="ts">
defineProps<{ text: string }>()
</script>
<template>
    <p class="c-empty-collection">{{ text }}</p>
</template>
