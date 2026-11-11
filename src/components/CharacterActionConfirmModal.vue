<script setup lang="ts">
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
        <section
            class="character-action-confirm c-sheet-section"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
        >
            <h2>{{ title }}</h2>
            <p>{{ message }}</p>
            <div class="c-editor-actions">
                <NButton type="default" @click="emit('close')">Отмена</NButton>
                <NButton :type="danger ? 'error' : 'primary'" @click="confirm">{{
                    confirmLabel
                }}</NButton>
            </div>
        </section>
    </NModal>
</template>

<style scoped>
.character-action-confirm {
    width: min(520px, calc(100vw - 28px));
    box-sizing: border-box;
}
.character-action-confirm h2 {
    margin-top: 0;
}
.character-action-confirm p {
    color: var(--sheet-muted);
    line-height: 1.5;
}
</style>
