import { createDiscreteApi, type NotificationOptions } from 'naive-ui'

const { notification } = createDiscreteApi(['notification'], {
    notificationProviderProps: {
        placement: 'bottom-right',
    },
})

export function useAlert() {
    const options: Omit<NotificationOptions, 'content'> = {
        duration: 5000,
        closable: true,
    }

    function openAlert(content: string): void {
        notification.info({ content, ...options })
    }

    function openSucces(content = 'Успешно!'): void {
        notification.success({ content, ...options })
    }

    function openError(content = 'Ошибка!'): void {
        notification.error({ content, ...options })
    }

    return {
        openAlert,
        openSucces,
        openError,
    }
}
