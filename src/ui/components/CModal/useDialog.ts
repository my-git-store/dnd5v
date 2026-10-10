import { type Component, type VNodeProps, ref } from "vue";
import type { AllowedComponentProps } from "vue";

type ComponentProps<C extends Component> = 
    C extends new (...ags: any) => any ? Omit<InstanceType<C>['$props'], keyof VNodeProps | keyof AllowedComponentProps> : never

export type CModalComponent<C extends Component = Component> = {
    component: C,
    componentProps?: ComponentProps<C>
}

let modals = ref<CModalComponent[]>([])

export const useDialog = () => {
    const modalRef = ref()
    function close() {
        if(modalRef.value) {
            if(modalRef.value && modalRef.value?.isBlock === true)
                return
            else 
                modals.value.splice(modals.value.length - 1, 1)
        } else
            modals.value.splice(modals.value.length - 1, 1)
    }
    function open<C extends Component>(comp: CModalComponent<C>) {
        modals.value.push(comp)
    }
    return {
        close,
        open,
        modals,
        modalRef
    }
}
