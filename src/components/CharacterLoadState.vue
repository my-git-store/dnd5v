<script setup lang="ts">
type Emits = {
    retry: []
    create: []
}

defineProps<{ loading: boolean; error: string | null }>()

const emit = defineEmits<Emits>()
</script>
<template>
    <div v-if="loading" class="load-state" role="status" aria-label="Загрузка персонажа">
        <div class="load-state-spinner">
            <NSpin size="large" />
        </div>
    </div>
    <div v-else-if="error" class="load-state error-state" role="alert">
        <p>{{ error }}</p>
        <NButton type="primary" @click="emit('retry')">Повторить</NButton>
        <NButton @click="emit('create')">Создать персонажа</NButton>
    </div>
</template>

<style scoped>
.error-state {
    color: var(--sheet-danger);
}

.load-state {
    min-height: clamp(320px, calc(100dvh - 110px), 720px);
    box-sizing: border-box;
    display: grid;
    place-items: center;
    padding: 24px;
    text-align: center;
}

.load-state-spinner {
    display: grid;
    place-items: center;
    width: clamp(136px, 18vw, 184px);
    height: clamp(136px, 18vw, 184px);
}

.load-state-spinner>* {
    width: 100%;
    height: 100%;
}

.error-state {
    gap: 12px;
}
</style>
