import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { ref } from 'vue'

export function useFormSubmit<Result>(submit: () => Promise<Result> | Result, rules: FormRules) {
    const formRef = ref<FormInst | null>(null)

    const loading = ref(false)

    async function handleSubmit(): Promise<void> {
        if (loading.value) return
        await formRef.value?.validate(async errors => {
            if (errors) return
            loading.value = true
            try {
                await submit()
            } finally {
                loading.value = false
            }
        })
    }

    return {
        formRef,
        rules,
        loading,
        handleSubmit,
    }
}

export function useFormSettings() {
    const requiresRule: FormItemRule = {
        required: true,
        message: 'Поле обязательное',
        trigger: ['blur'],
    }

    function limitStringRender(maxLength: number): (props: { value: string }) => string {
        return props => `${props.value?.length ?? 0} / ${maxLength}`
    }

    return {
        requiresRule,
        useFormSubmit,
        limitStringRender,
    }
}
