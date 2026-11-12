<script setup lang="ts">
import type { StoredCharacterSummary } from '../api/characterStorage'

defineProps<{
    characters: StoredCharacterSummary[]
    activeId: string | null
    dirty: boolean
    disabled: boolean
    status?: { kind: 'success' | 'error'; text: string } | null
}>()
</script>

<template>
    <section
        class="flex flex-wrap items-center justify-between gap-4"
        aria-label="Управление персонажами"
    >
        <div>
            <strong v-if="characters.length">Текущий лист персонажа</strong>
            <strong v-else>Персонажей пока нет</strong>
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <NButton
                type="default"
                tag="a"
                href="https://forms.yandex.ru/u/6aec6367c45c070febaff5f5"
                target="_blank"
                rel="noopener noreferrer"
                >Пройти опрос</NButton
            >
        </div>
        <p v-if="status" role="status" aria-live="polite">
            {{ status.text }}
        </p>
    </section>
</template>
