<script setup lang="ts">
import { NButton, NCard, NModal } from 'naive-ui'

export type Props = {
    text: string
    onOk: () => void | Promise<void>
}

type Emits = {
    close: []
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
    text: '',
})

async function confirmFunction(): Promise<void> {
    await props.onOk()
    emit('close')
}
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')" :mask-closable="true">
        <NCard class="min-h-[100px] p-6!">
            <template #header>Вы уверены, что хотите {{ props.text }}</template>
            <div class="flex w-full gap-4">
                <NButton class="flex-1" @click="emit('close')">Отмена</NButton>
                <NButton class="flex-1" type="primary" @click="confirmFunction">Принять</NButton>
            </div>
        </NCard>
    </NModal>
</template>
