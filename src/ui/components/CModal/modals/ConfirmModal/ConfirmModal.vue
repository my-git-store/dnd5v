<script setup lang="ts">
import { CBtn, CCard, CModal, useDialog } from '@/ui/components';

export type Props = {
    text: string,
}

type Emits = {
    ok: []
}

const emit = defineEmits<Emits>()
const props = withDefaults(defineProps<Props>(), {
    text: ''
})

const { close } = useDialog()

async function confirmFunction() {
    emit('ok')
    close()
}
</script>

<template>
    <CModal @close="close">
        <CCard class="min-h-[100px] p-6!">
            <template #title>
                Вы уверены что хотите {{ text }}
            </template>
            <template #default>
                <div class="c-flex-row w-full">
                    <CBtn class="flex-1" @click="close" color-type="accent">Отмена</CBtn>
                    <CBtn class="flex-1" @click="confirmFunction" color-type="primary">
                        Принять
                    </CBtn>
                </div>
            </template>
        </CCard>
    </CModal>
</template>
