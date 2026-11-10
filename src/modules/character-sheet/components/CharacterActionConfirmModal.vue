<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'

const props = withDefaults(
    defineProps<{
        title: string
        message: string
        confirmLabel?: string
        danger?: boolean
        onConfirm?: () => void | Promise<void>
    }>(),
    { confirmLabel: 'Подтвердить', danger: false },
)

const emit = defineEmits<{ close: [] }>()

const { close } = useDialog()

async function confirm() {
    await props.onConfirm?.()
    close()
}
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')">
        <section
            class="character-action-confirm sheet-section"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
        >
            <h2>{{ title }}</h2>
            <p>{{ message }}</p>
            <div class="editor-actions">
                <NButton type="default" @click="close">Отмена</NButton>
                <NButton :type="danger ? 'error' : 'primary'" @click="confirm">{{
                    confirmLabel
                }}</NButton>
            </div>
        </section>
    </NModal>
</template>
