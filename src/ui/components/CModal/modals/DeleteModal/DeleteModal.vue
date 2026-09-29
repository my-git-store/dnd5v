<script setup lang="ts">
import { CBtn, CCard, CModal, useDialog, useAlert } from '@/ui/components';
import { useReqDefault } from '@/composables/useReqDefault';

export type Props = {
    entityName?: string
    deleteFunc: () => Promise<unknown>
}

type Emits = {
    delete: []
}

const emit = defineEmits<Emits>()
const props = withDefaults(defineProps<Props>(), {
    entityName: ''
})

const { close, modalRef } = useDialog()
const { openSucces, openError } = useAlert()

const { isLoading, request, isError } = useReqDefault()

async function deleteFunction() {
    await request(props.deleteFunc())
    if (isError.value)
        openError()
    else
        openSucces()
    emit('delete')
    close()
}
</script>

<template>
    <CModal @close="close" :is-block="isLoading" :ref="(el) => modalRef = el">
        <CCard class="min-h-[100px] p-6!">
            <template #title>
                Вы уверены что хотите удалить <span v-if="entityName.length > 0">
                    {{ entityName + '?' }}
                </span>
                <span v-else>?</span>
            </template>
            <template #default>
                <div class="c-flex-row w-full">
                    <CBtn class="flex-1" @click="close" color-type="accent">Отмена</CBtn>
                    <CBtn class="flex-1" :loading="isLoading" @click="deleteFunction" color-type="delete">
                        Удалить
                    </CBtn>
                </div>
            </template>
        </CCard>
    </CModal>
</template>
