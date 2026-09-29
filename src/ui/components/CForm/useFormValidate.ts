import { ref } from "vue"

const isResult = ref<boolean>(false)

export const useFormValidate = () => {
    function setResult(val: boolean) {
        isResult.value = val
    }
    return {
        setResult,
        isResult
    }
}