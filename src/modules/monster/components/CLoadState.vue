<script setup lang="ts">
import { NAlert, NButton, NSpin } from 'naive-ui'

import { useMonsterSheet } from '../composables/useMonsterSheet'

const { isLoading, loadError, load } = useMonsterSheet()

const emit = defineEmits<{ create: [] }>()
</script>

<template>
    <div v-if="isLoading" role="status" aria-label="Загрузка монстра">
        <NSpin size="large" />
    </div>
    <NAlert v-else-if="loadError" type="error" role="alert" title="Ошибка загрузки">
        <p>{{ loadError }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
            <NButton type="primary" @click="load">Повторить</NButton>
            <NButton @click="emit('create')">Создать монстра</NButton>
        </div>
    </NAlert>
</template>
