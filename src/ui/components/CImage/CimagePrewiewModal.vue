<script setup lang="ts">
import { CModal } from "../index"

type Props = {
    src: string
}

const props = withDefaults(defineProps<Props>(), {
    src: ''
})
</script>

<template>
    <CModal>
        <img class="max-h-[500px] max-w-[500px]" v-if="props.src" :src="props.src" />
    </CModal>
</template>