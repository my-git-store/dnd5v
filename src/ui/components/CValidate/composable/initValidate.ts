import { ref, computed, type Ref } from 'vue'

import {useRulesResult} from './useRulesComposable'

export const useComponentValidate = (rules: Function[] = [], model: Ref<unknown>) => {
    const isValidComponent = ref<boolean>(false)
    const errorMessage = ref<string>('')

    const modelUse = computed(() => model.value)

    function validate() {
        const result = useRulesResult(rules, modelUse.value)
        isValidComponent.value = result === true ? true : false
        errorMessage.value = result === true ? '' : String(result)
        return result
    }

    return { validate, isValidComponent, errorMessage }
}