<script setup lang="ts">
import { ref, inject, watch, useId, type Ref } from 'vue';
import { useComponentValidate } from '../CValidate/composable/initValidate';
import CErrorMessage from '../CValidate/CErrorMessage.vue';

type Props = {
    disabled?: boolean,
    label?: string,
    rules?: Function[],
}

const props = withDefaults(defineProps<Props>(), {
    rules: () => []
})

const isValidCheck = inject<Ref<boolean>>('FormValidate', ref(false))

const inputMod = defineModel<string | number>({ default: '' })
const inputId = useId()

const { validate, errorMessage } = useComponentValidate(props.rules, inputMod)

watch(isValidCheck, () => validate())
</script>

<template>
    <div class="c-flex-col gap-1!">
        <label :for="String($attrs.id ?? inputId)" class="text-md font-bold text-primary-1000 tracking-wider" v-if="label">
            {{ label }}
        </label>
        <textarea :id="String($attrs.id ?? inputId)" :disabled="props.disabled" ref="textareaRef" autocomplete="off" placeholder=""
            class="c-input c-input-textarea c-scrollbar c-input-border"
            :class="{ 'c-disabled': props.disabled === true, 'c-input-validate': errorMessage.length > 0 }"
            v-model.trim="inputMod" :required="props.rules?.length !== 0" @blur="validate" @invalid="validate"
            v-bind="$attrs" />
        <CErrorMessage v-if="props.rules.length > 0" :error-message="errorMessage" />
    </div>
</template>

<style scoped>
@import url('./CInput.css');
</style>
