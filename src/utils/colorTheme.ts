import type { GlobalThemeOverrides } from 'naive-ui'
import { ref } from 'vue'

import { theme } from './allColors'

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
        heightMedium: '44px',
        fontSizeMedium: '15px',
    },
    Card: {
        borderRadius: theme.radius.card,
    },
    Input: {
        borderRadius: theme.radius.input,
        heightMedium: '44px',
        fontSizeMedium: '15px',
        paddingMedium: '0 14px',
    },
    Form: {
        labelFontWeight: '600',
    },
})

export function useColorTheme() {
    return {
        naiveTheme,
        theme,
    }
}
