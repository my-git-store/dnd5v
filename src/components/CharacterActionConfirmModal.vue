<script setup lang="ts">
import { NButton, NCard, NModal } from 'naive-ui'

export type Props = {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
}

type Emits = {
    close: []
}

const props = withDefaults(defineProps<Props>(), { confirmLabel: 'Подтвердить', danger: false })

const emit = defineEmits<Emits>()

async function confirm() {
    await props.onConfirm?.()
    emit('close')
}
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')">
        <NCard
            class="w-full max-w-xl max-h-[90vh] overflow-auto"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
        >
            <h2>{{ title }}</h2>
            <p>{{ message }}</p>
            <div class="flex flex-wrap items-center gap-2">
                <NButton type="default" @click="emit('close')">Отмена</NButton>
                <NButton :type="danger ? 'error' : 'primary'" @click="confirm">{{
                    confirmLabel
                }}</NButton>
            </div>
        </NCard>
    </NModal>
</template>
