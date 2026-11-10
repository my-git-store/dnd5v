<script setup lang="ts">
import { NButton, NCard, NModal } from 'naive-ui'

import { useDialog } from '@/composables/useDialog'

export type Props = {
    text: string
}

type Emits = {
    ok: []
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
    text: '',
})

const { close } = useDialog()

function confirmFunction(): void {
    emit('ok')
    close()
}
</script>

<template>
    <NModal :show="true" :on-close="close" :mask-closable="true">
        <NCard class="min-h-[100px] p-6!">
            <template #header>Вы уверены, что хотите {{ props.text }}</template>
            <div class="flex w-full gap-4">
                <NButton class="flex-1" @click="close">Отмена</NButton>
                <NButton class="flex-1" type="primary" @click="confirmFunction">Принять</NButton>
            </div>
        </NCard>
    </NModal>
</template>
