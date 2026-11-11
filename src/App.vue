<script setup lang="ts">
import { computed, ref } from 'vue'

import CharacterSheetPage from '@/views/CharacterSheetPage.vue'
import { useColorTheme } from '@/utils/colorTheme'

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
                        <main class="app-shell">
                            <CharacterSheetPage />
                        </main>
                    </n-message-provider>
                </n-modal-provider>
            </n-dialog-provider>
        </n-notification-provider>
    </n-config-provider>
</template>

<style>
/* Document background and print settings apply outside Vue component roots. */
html,
body,
#app {
    min-height: 100%;
}
body {
    margin: 0;
    background-color: #e9dbc2;
    background-image:
        linear-gradient(rgba(249, 239, 218, 0.26), rgba(230, 205, 165, 0.2)),
        var(--sheet-map-background, none);
    background-position: center top;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: fixed;
}
@media (max-width: 560px) {
    body {
        background-attachment: scroll;
        background-size: auto 100%;
    }
}
@page {
    size: auto;
    margin: 12mm;
}
@media print {
    html,
    body {
        min-height: 0;
        background: #fff !important;
    }
    .n-modal-mask,
    .n-modal {
        display: none !important;
    }
    input,
    select,
    textarea {
        color: #111 !important;
        background: #fff !important;
    }
}
</style>
