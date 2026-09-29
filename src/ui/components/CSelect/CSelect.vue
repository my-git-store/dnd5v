<script setup lang="ts">
import { ref, inject, watch, computed, type Ref } from 'vue';
import { useComponentValidate } from '../CValidate/composable/initValidate';
import CErrorMessage from '../CValidate/CErrorMessage.vue';
import CSelectMenu from './CSelectMenu.vue';
import { type CInputProps } from '../CInput/types/index';

export type InputProps = CInputProps & {
    items?: unknown[],
    keyValue?: string,
    keyLabel?: string,
}

const props = withDefaults(defineProps<InputProps>(), {
    rules: () => [],
    keyValue: '',
    keyLabel: '',
    items: () => [],
    disabled: false,
})

const isValidCheck = inject<Ref<boolean>>('FormValidate', ref(false))

const inputMod = defineModel<unknown>({ default: '' })

const { validate, errorMessage } = useComponentValidate(props.rules, inputMod)

const isOpen = ref<boolean>(false)

const isKeyLabel = computed<boolean>(() => {
    if (props.keyLabel && props.keyLabel.length > 0)
        return true
    return false
})
const isKeyValue = computed<boolean>(() => {
    if (props.keyValue && props.keyValue.length > 0)
        return true
    return false
})

function readKey(value: unknown, key: string): unknown {
    return typeof value === 'object' && value !== null && key in value
        ? (value as Record<string, unknown>)[key] : undefined
}
function updateModel(val: unknown) {
    isOpen.value = false
    if (isKeyValue.value === true)
        inputMod.value = readKey(val, props.keyValue)
    else
        inputMod.value = val
}

function openMenu() {
    if (props.disabled)
        return
    isOpen.value = true
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
    <div class="relative">
        <div class="text-md font-bold text-primary-1000 tracking-wider" v-if="props.label">
            {{ props.label }}
        </div>
        <input ref="inputRef" @click="openMenu" data-readonly @keydown.prevent @keyup.prevent @paste.prevent
            autocomplete="off" placeholder="" class="c-select relative w-full"
            :class="{ 'c-disabled': props.disabled, 'c-select-validate': errorMessage.length > 0 }"
            :aria-invalid="errorMessage.length > 0" v-model="inputMod" v-bind="{ ...$attrs, ...props }"
            :required="props.rules?.length !== 0" @focusout="validate" @invalid="validate" />
        <CSelectMenu v-if="isOpen" @close="isOpen = false">
            <slot name="list" :list="props.items">
                <div v-for="(item, index) in props.items" :key="index" @click.prevent="updateModel(item)">
                    <slot name="option-item" :item="item">
                        {{ isKeyLabel ? readKey(item, props.keyLabel) : item }}
                    </slot>
                </div>
                <!-- <slot name="option-item" v-for="(item, index) in props.items" :key="`select-option-${index}`"
                    :item="item" @click="updateModel(item)">
                    <COption :value="isKeyValue ? item[props.keyValue] : item">
                        {{ isKeyLabel ? item[props.keyLabel] : item }}
                    </COption>
                </slot> -->
            </slot>
        </CSelectMenu>
        <CErrorMessage v-if="props.rules.length > 0" :error-message="errorMessage" />
    </div>
</template>

<style scoped>
@import url('./CSelect.css');

input[data-readonly] {
    /* pointer-events: none;
    cursor: default; */
    caret-color: transparent;
    user-select: none;
}
</style>
