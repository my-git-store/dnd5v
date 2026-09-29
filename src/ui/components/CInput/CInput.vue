<script setup lang="ts">
import { ref, inject, watch, useId, type Ref } from 'vue';
import { useComponentValidate } from '../CValidate/composable/initValidate';
import CErrorMessage from '../CValidate/CErrorMessage.vue';
import { Icon } from '@iconify/vue';
import type { CInputProps } from './types';

export type InputProps = CInputProps

type Emit = {
    clear: [unknown]
}

const emit = defineEmits<Emit>()

const props = withDefaults(defineProps<InputProps>(), {
    rules: () => [],
    disabled: false,
    clearable: false

})

const inputMod = defineModel<unknown>({ default: '' })
const inputId = useId()

const { validate, errorMessage } = useComponentValidate(props.rules, inputMod)

const isValidCheck = inject<Ref<boolean>>('FormValidate', ref(false))

function clearInput() {
    inputMod.value = undefined
    emit('clear', inputMod.value)
}

watch(isValidCheck, () => {
    if (isValidCheck.value === true)
        validate()
})
watch(inputMod, () => {
    validate()
})

defineExpose({
    validate,
})
</script>

<template>
    <div class="c-flex-col gap-1! relative">
        <label :for="String($attrs.id ?? inputId)" class="text-md font-bold text-primary-1000 tracking-wider" v-if="props.label">
            {{ props.label }}
        </label>
        <div class="c-flex-row w-full relative">
            <input :id="String($attrs.id ?? inputId)" ref="inputRef" autocomplete="off" placeholder="" class="c-input w-full c-input-border"
                :class="{ 'c-disabled': props.disabled, 'c-input-validate': errorMessage.length > 0 }"
                :aria-invalid="errorMessage.length > 0" v-model.trim="inputMod" v-bind="{ ...$attrs, ...props }"
                :required="props.rules?.length !== 0" @focusout="validate" @invalid="validate" />
            <div class="absolute right-0 p-1 h-full c-flex-col justify-center"
                v-if="props.clearable === true && typeof inputMod === 'string' && inputMod.length !== 0"
                @click.prevent="clearInput">
                <Icon icon="iconamoon:close-circle-1-thin" height="30" width="30"
                    class="bg-stone-200 rounded-full cursor-pointer" />
            </div>
        </div>
        <CErrorMessage v-if="props.rules.length > 0" :error-message="errorMessage" />
    </div>
</template>

<style scoped>
@import url('./CInput.css');
</style>
