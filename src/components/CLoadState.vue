<script setup lang="ts">
import { NButton, NSpin } from 'naive-ui'
import { useCharacterSheet } from '@/composables/useCharacterSheet'

type Emits = {
    create: []
}

const { isLoading, loadError, load } = useCharacterSheet()

const emit = defineEmits<Emits>()
</script>
<template>
    <div
        v-if="isLoading"
        class="grid min-h-[70vh] place-items-center py-12"
        role="status"
        aria-label="Загрузка персонажа"
    >
        <div>
            <NSpin size="large" />
        </div>
    </div>
    <div
        v-else-if="loadError"
        class="mx-auto grid min-h-[70vh] max-w-xl content-center justify-items-center gap-4 text-center"
        role="alert"
    >
        <p>{{ loadError }}</p>
        <NButton type="primary" @click="load()">Повторить</NButton>
        <NButton @click="emit('create')">Создать персонажа</NButton>
    </div>
</template>
