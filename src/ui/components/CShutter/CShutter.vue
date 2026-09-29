<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef, computed, ref, onMounted } from 'vue'

type Props = {
    position?: 'left' | 'right'
}

type Emits = {
    close: []
}

const props = withDefaults(defineProps<Props>(), {
    position: 'right'
})
const emit = defineEmits<Emits>()

const target = useTemplateRef('shutterRef')

const focusItems = computed(() => target.value?.childNodes.length || 0)
const activeFocusIndex = ref(0)

onClickOutside(target, () => emit('close'))

function blockTab() {
    activeFocusIndex.value++
    if (activeFocusIndex.value === focusItems.value) {
        target.value?.setAttribute('tabindex', '0')
        target.value?.focus()
        activeFocusIndex.value = 0
    }
}

const shutterClasses = computed<string>(() => {
    if (props.position === 'left')
        return ''
    else
        return 'c-shutter-right'
})

onMounted(() => {
    target.value?.setAttribute('tabindex', '0')
    target.value?.focus()
})
</script>

<template>
    <!-- :class="shutterClasses" -->
    <dialog ref="shutterRef" tabindex="0" class="c-shutter" :class="shutterClasses" @keydown.tab.prevent="blockTab">
        <slot name="default" />
    </dialog>
</template>

<style scoped>
/* @import url('./shutter-animate.css'); */

.c-shutter {
    padding: 16px;
    display: block;
    height: 100%;
    background-color: white;
}

.c-shutter-right {
    margin-left: auto;
}
</style>
