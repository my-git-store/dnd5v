<script setup lang="ts">
export type Props = {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
}

const props = withDefaults(
    defineProps<Props>(),
    { confirmLabel: 'Подтвердить', danger: false },
)

const emit = defineEmits<{ close: [] }>()

async function confirm() {
    await props.onConfirm?.()
    emit('close')
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
                <NButton type="default" @click="emit('close')">Отмена</NButton>
                <NButton :type="danger ? 'error' : 'primary'" @click="confirm">{{
                    confirmLabel
                }}</NButton>
            </div>
        </section>
    </NModal>
</template>
