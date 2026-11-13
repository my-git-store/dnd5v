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
    <div v-if="isLoading" role="status" aria-label="Загрузка персонажа">
        <div>
            <NSpin size="large" />
        </div>
    </div>
    <div v-else-if="loadError" role="alert">
        <p>{{ loadError }}</p>
        <NButton type="primary" @click="load">Повторить</NButton>
        <NButton @click="emit('create')">Создать персонажа</NButton>
    </div>
</template>
