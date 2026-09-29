<script setup lang="ts">
type Props = {
    errorMessage: string
}
const props = withDefaults(defineProps<Props>(), {
    errorMessage: ''
})
</script>

<template>
    <div class="text-error min-h-5">
        <p v-if="props.errorMessage.length > 0">{{ props.errorMessage }}</p>
    </div>
</template>