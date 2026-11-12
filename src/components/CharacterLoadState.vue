<script setup lang="ts">
type Emits = {
    retry: []
    create: []
}

defineProps<{ loading: boolean; error: string | null }>()

const emit = defineEmits<Emits>()
</script>
<template>
    <div v-if="loading" role="status" aria-label="Загрузка персонажа">
        <div>
            <NSpin size="large" />
        </div>
    </div>
    <div v-else-if="error" role="alert">
        <p>{{ error }}</p>
        <NButton type="primary" @click="emit('retry')">Повторить</NButton>
        <NButton @click="emit('create')">Создать персонажа</NButton>
    </div>
</template>
