<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

type Props = {
    text: string,
    duration: number,
    isDefaultDesc?: boolean,
    gap?: string
}
const props = withDefaults(defineProps<Props>(), {
    text: '',
    duration: 0,
    isDefaultDesc: true,
    gap: 'gap-0.5'
})

const interval = ref<ReturnType<typeof setInterval> | null>(null)

const textArrayIndex = ref(props.text.length)
const isDesc = ref(true)

function initInterval() {
    interval.value = setInterval(() => {
        setIndex()
    }, props.duration)
}

function deleteInterval() {
    interval.value = null
}

function setIndex() {
    if (isDesc.value === true) {
        if (textArrayIndex.value === 1) {
            isDesc.value = !isDesc.value
            setIndex()
        } else
            textArrayIndex.value -= 1
    } else {
        if (textArrayIndex.value === props.text.length) {
            isDesc.value = !isDesc.value
            setIndex()
        } else
            textArrayIndex.value += 1
    }
}

const textArray = computed(() => {
    if (textArrayIndex.value === 0)
        return []
    const arr = props.text.split("")
    arr.length = textArrayIndex.value
    return arr
})

onMounted(() => {
    initInterval()
})
onUnmounted(() => {
    deleteInterval()
})
</script>

<template>
    <span>
        <span v-for="(item, index) in textArray" :key="`word-part-${item}-${index}`">{{ item
            }}</span>
        <span class="text-cursor">|</span>
    </span>
</template>

<style scoped>
.text-cursor {}
</style>
