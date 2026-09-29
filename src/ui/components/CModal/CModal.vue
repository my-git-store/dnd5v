<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef, computed, ref, onMounted } from 'vue'

type Emits = {
    close: []
}
type Props = {
    isBlock?: boolean
}
const emit = defineEmits<Emits>()
const props = withDefaults(defineProps<Props>(), {
    isBlock: false
})

const target = useTemplateRef('dialogRef')

const focusItems = computed(() => target.value?.childNodes.length || 0)
const activeFocusIndex = ref(0)

onClickOutside(target, (event) => {
    if (props.isBlock) return

    const el = event.target as HTMLElement

    if (el.closest('[data-ignore-outside="true"]')) return

    emit('close')
})

function blockTab() {
    activeFocusIndex.value++
    if (activeFocusIndex.value === focusItems.value) {
        target.value?.setAttribute('tabindex', '0')
        target.value?.focus()
        activeFocusIndex.value = 0
    }
}
onMounted(() => {
    target.value?.setAttribute('tabindex', '0')
    target.value?.focus()
})

defineExpose({
    isBlock: props.isBlock
})
</script>

<template>
    <dialog ref="dialogRef" tabindex="0" class="c-modal" @keydown.tab.prevent="blockTab">
        <slot name="default" />
    </dialog>
</template>

<style scoped>
.c-modal {
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;

    transform: translate(-50%, -50%);
}
</style>