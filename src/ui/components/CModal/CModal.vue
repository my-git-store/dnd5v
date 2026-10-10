<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef, onMounted, onUnmounted } from 'vue'

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

let previousFocus: HTMLElement | null = null

onClickOutside(target, (event) => {
    if (props.isBlock) return

    const el = event.target as HTMLElement

    if (el.closest('[data-ignore-outside="true"]')) return

    emit('close')
})

function trapTab(event: KeyboardEvent) {
    const dialog = target.value
    if (!dialog) return
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'))
        .filter((element) => element.getClientRects().length > 0)
    if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault()
        last?.focus()
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault()
        first?.focus()
    }
}
onMounted(() => {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    target.value?.setAttribute('tabindex', '0')
    target.value?.focus()
})
onUnmounted(() => previousFocus?.focus())

defineExpose({
    isBlock: props.isBlock
})
</script>

<template>
    <dialog ref="dialogRef" tabindex="0" class="c-modal" @keydown.tab="trapTab" @keydown.esc="!isBlock && emit('close')">
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
