<script setup lang="ts">
type Emits = {
    'update:query': [value: string]
}

defineProps<{ label: string; query: string }>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div class="collection-search">
        <NFormItem :label="label"
            ><NInput :value="query" @update:value="emit('update:query', String($event ?? ''))"
        /></NFormItem>
        <NButton :disabled="!query" @click="emit('update:query', '')">Сбросить</NButton>
    </div>
</template>

<style scoped>
.collection-search {
    display: flex;
    align-items: end;
    gap: 12px;
    margin: 0 0 16px;
}
.collection-search > :first-child {
    flex: 1;
    min-width: 0;
}
</style>
