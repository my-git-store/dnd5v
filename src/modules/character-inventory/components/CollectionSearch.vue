<script setup lang="ts">
type Emits = {
    'update:query': [value: string]
}

defineProps<{ label: string; query: string }>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div>
        <NFormItem :label="label"
            ><NInput :value="query" @update:value="emit('update:query', String($event ?? ''))"
        /></NFormItem>
        <NButton :disabled="!query" @click="emit('update:query', '')">Сбросить</NButton>
    </div>
</template>
