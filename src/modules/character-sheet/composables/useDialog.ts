import { ref, type Component } from 'vue'

export type ModalComponent = {
    component: Component
    componentProps?: object
}

const modals = ref<ModalComponent[]>([])

export function useDialog() {
    function close(): void {
        modals.value.pop()
    }

    function open(component: ModalComponent): void {
        modals.value.push(component)
    }

    return {
        close,
        open,
        modals,
    }
}
