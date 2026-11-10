import type {
    NButton,
    NCard,
    NCheckbox,
    NConfigProvider,
    NDialogProvider,
    NFormItem,
    NInput,
    NInputNumber,
    NMessageProvider,
    NModal,
    NModalProvider,
    NNotificationProvider,
    NSpin,
    NSelect,
    NTab,
    NTabs,
} from 'naive-ui'

declare module '*.css'

declare module 'vue' {
    export interface GlobalComponents {
        NButton: typeof NButton
        NCard: typeof NCard
        NCheckbox: typeof NCheckbox
        NConfigProvider: typeof NConfigProvider
        NDialogProvider: typeof NDialogProvider
        NFormItem: typeof NFormItem
        NInput: typeof NInput
        NInputNumber: typeof NInputNumber
        NMessageProvider: typeof NMessageProvider
        NModal: typeof NModal
        NModalProvider: typeof NModalProvider
        NNotificationProvider: typeof NNotificationProvider
        NSpin: typeof NSpin
        NSelect: typeof NSelect
        NTab: typeof NTab
        NTabs: typeof NTabs
    }
}
