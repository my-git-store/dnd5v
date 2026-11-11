<script setup lang="ts">
import { computed, ref } from 'vue'

import CharacterSheetPage from '@/views/CharacterSheetPage.vue'
import { useColorTheme } from '@/utils/colorTheme'
import { NScrollbar } from 'naive-ui'

const { naiveTheme, theme } = useColorTheme()

const primaryColor = ref(theme.colors.primary.primary950)

const themeOverrides = computed(() => ({
    ...naiveTheme.value,
    common: {
        ...naiveTheme.value.common,
        primaryColor: primaryColor.value,
    },
}))
</script>

<template>
    <n-config-provider :theme-overrides="themeOverrides">
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

<style>
body {
    background-color: #e9dbc2;
}
</style>
