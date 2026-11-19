<script setup lang="ts">
// import CharacterSheetPage from '@/views/CharacterSheetPage.vue'
import {
    NConfigProvider,
    NDialogProvider,
    NMessageProvider,
    NModalProvider,
    NNotificationProvider,
    NScrollbar,
    ruRU,
    dateRuRU,
    type GlobalThemeOverrides,
} from 'naive-ui'
import { computed, ref } from 'vue';
import colors from "tailwindcss/colors";

import MonsterSheetPage from './modules/monster/views/MonsterSheetPage.vue';

const tailwindColors = colors;

const inputNumberAlignmentClass = '[&_.n-input-number_input]:text-center!'

const theme = {
    colors: {
        primary: {
            primary1000: "#3e2c1c",
            primary950: "#5a4430",
        },
        secondary: {
            secondary1000: "#8b7355",
        },
        accent: "#d4c4b5",
        background: {
            background1: "#f7f3f0",
        },
    },

    fonts: {
        base: "'Plus Jakarta Sans', sans-serif",
        serif: "'Lora', serif",
        slav: "'Slaviansky', sans-serif",
    },
    fontColors: {
        base: tailwindColors.stone[800],
    },

    radius: {
        button: "16px",
        input: "12px",
        card: "16px",
        modal: "16px",
    },
} as const;

const naiveTheme = ref<GlobalThemeOverrides>({
    common: {
        fontFamily: theme.fonts.base,

        primaryColor: theme.colors.primary.primary950,
        primaryColorHover: theme.colors.secondary.secondary1000,
        primaryColorPressed: theme.colors.primary.primary1000,
        primaryColorSuppl: theme.colors.secondary.secondary1000,
    },

    Button: {
        borderRadiusMedium: theme.radius.button,
        heightMedium: "44px",
        fontSizeMedium: "15px",
    },

    Card: {
        borderRadius: theme.radius.card,
    },

    Input: {
        borderRadius: theme.radius.input,
        heightMedium: "44px",
        fontSizeMedium: "15px",
        paddingMedium: "0 14px",
    },
    Select: {
        peers: {
            InternalSelection: {
                heightMedium: "44px",
                fontSizeMedium: "15px",
                borderRadius: theme.radius.input,
            }
        }
    },

    Form: {
        labelFontWeight: "600",
    },
});

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

const themeNaive = computed(() => {
    return {
        ...naiveTheme.value,
        common: {
            ...naiveTheme.value.common,
        }
    }
})
</script>

<template>
    <n-config-provider :theme-overrides="themeNaive" :locale="locale" :class="inputNumberAlignmentClass"
        :date-locale="dateRuRU">
        <n-notification-provider placement="bottom-right">
            <n-dialog-provider>
                <n-modal-provider>
                    <n-message-provider placement="bottom-right" :duration="3000" :closable="true">
                        <NScrollbar class="h-[800px]">
                            <MonsterSheetPage class="overflow-auto w-[1000px]" />
                        </NScrollbar>
                    </n-message-provider>
                </n-modal-provider>
            </n-dialog-provider>
        </n-notification-provider>
    </n-config-provider>
</template>
