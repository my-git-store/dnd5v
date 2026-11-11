<script setup lang="ts">
import { NButton, NCard, NModal } from 'naive-ui'

import { useReqDefault } from '@/composables/useReqDefault'

export type Props = {
    entityName?: string
    deleteFunc: () => Promise<unknown>
}

type Emits = {
    close: []
    delete: []
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
    entityName: '',
})

const { isLoading, request } = useReqDefault(true)

async function deleteFunction(): Promise<void> {
    const [, error] = await request(props.deleteFunc())
    if (error) return
    emit('delete')
    emit('close')
}
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')" :mask-closable="!isLoading">
        <NCard class="min-h-[100px] p-6!">
            <template #header>
                Вы уверены, что хотите удалить
                <span v-if="props.entityName">{{ props.entityName }}?</span><span v-else>?</span>
            </template>
            <div class="flex w-full gap-4">
                <NButton class="flex-1" :disabled="isLoading" @click="emit('close')"
                    >Отмена</NButton
                >
                <NButton class="flex-1" type="error" :loading="isLoading" @click="deleteFunction"
                    >Удалить</NButton
                >
            </div>
        </NCard>
    </NModal>
</template>
