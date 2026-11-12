<script setup lang="ts">
import CharacterSheetPage from '@/views/CharacterSheetPage.vue'
import { NScrollbar } from 'naive-ui'
import { NConfigProvider, ruRU, dateRuRU } from 'naive-ui'

const inputNumberAlignmentClass = '[&_.n-input-number_input]:text-center!'


const locale = {
    ...ruRU,
    Input: {
        placeholder: '',
    },
    InputNumber: {
        placeholder: '',
    },
    Select: {
        placeholder: '',
    },
}
</script>

<template>
    <n-config-provider :locale="locale" :class="inputNumberAlignmentClass" :date-locale="dateRuRU">
        <n-notification-provider placement="bottom-right">
            <n-dialog-provider>
                <n-modal-provider>
                    <n-message-provider placement="bottom-right" :duration="3000" :closable="true">
                        <NScrollbar class="h-[800px]">
                            <CharacterSheetPage class="overflow-auto w-[1000px]" />
                        </NScrollbar>
                    </n-message-provider>
                </n-modal-provider>
            </n-dialog-provider>
        </n-notification-provider>
    </n-config-provider>
</template>