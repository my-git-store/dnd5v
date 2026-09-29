import { ref } from "vue"
import { tryCatch } from "./tryCatch"

export const useReqDefault = <T = unknown>() => {
    const isError = ref<boolean>(false)
    const isLoading = ref<boolean>(false)

    const request = async(promise: Promise<T>) => {
        isLoading.value = true
        const res = await tryCatch(promise)
        if(res[1])
            isError.value = true

        isLoading.value = false
        return res
    }
    return {
        isError,
        isLoading,
        request
    }
}