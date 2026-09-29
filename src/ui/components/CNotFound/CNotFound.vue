<script setup lang="ts">
import notFound from '@/assets/not-found.png'

type Props = {
    title?: string
}

const props = withDefaults(defineProps<Props>(), {
    title: 'Ничего не найдено'
})
</script>

<template>
    <div class="c-flex-col items-center">
        <img :src="notFound" />
        <div v-if="props.title.length > 0" class="font-bold">{{ props.title }}</div>
        <slot />
    </div>
</template>