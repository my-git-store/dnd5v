<script setup lang="ts">
import CLoader from '../CLoader/CLoader.vue';

type BtnType = HTMLButtonElement['type']

type Props = {
    type?: BtnType,
    disabled?: boolean,
    loading?: boolean,
    colorType?: 'primary' | 'accent' | 'delete'
}

const props = withDefaults(defineProps<Props>(), {
    colorType: undefined,
    type: 'button',
    disabled: false,
})
</script>

<template>
    <button class="c-btn" :class="[
        props.disabled || props.loading ? 'c-disabled' : 'cursor-pointer',
        props.colorType ? `c-btn-${props.colorType}` : ''
    ]" v-bind="props" :disabled="props.disabled || props.loading">
        <div :class="{ 'invisible': props.loading }">
            <slot name="default" />
        </div>
        <slot name="loader" v-if="props.loading">
            <CLoader class="c-btn-loader" />
        </slot>
    </button>
</template>

<style scoped>
@import url('./CBtn.css');
</style>