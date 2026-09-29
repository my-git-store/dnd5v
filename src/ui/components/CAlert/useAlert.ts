import { ref } from "vue"
import type { AlertProps } from "./CAlert.vue"

export type AlertObj = AlertProps & {
    id: number
}

let alerts = ref<AlertObj[]>([])
let id = 0

export const useAlert = () => {
    const errAlert: AlertProps = {
        type: 'error',
        title: 'Ошибка!'
    }
    const succesAlert: AlertProps = {
        type: 'succes',
        title: 'Успешно!'
    }
    function closeAlert(id: number) {
        alerts.value = alerts.value.filter(el => el.id !== id)
        if(alerts.value.length === 0)
            id = 0
    }
    function openAlert(props: AlertProps) {
        id += 1
        alerts.value.push({...props, id})
    }
    function openSucces(props: AlertProps = {...succesAlert}) {
        openAlert(props)
    }
    function openError(props: AlertProps = {...errAlert}) {
        openAlert(props)
    }
    return {
        closeAlert,
        openAlert,
        openSucces,
        openError,
        alerts,
        errAlert,
        succesAlert
    }
}
