<script setup lang="ts">
import { ref, provide } from 'vue'

type Emits = {
    sub: []
}

const emit = defineEmits<Emits>()

const isValidCheck = ref(false)

provide('FormValidate', isValidCheck)

function submitForm() {
    isValidCheck.value = false
    emit('sub')
}
</script>

<template>
    <form @submit.prevent="submitForm">
        <slot name="default" />
    </form>
</template>
