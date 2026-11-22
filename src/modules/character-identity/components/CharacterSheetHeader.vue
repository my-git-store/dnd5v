<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useCharacterSheet } from '@/composables/useCharacterSheet'

import IdentityFields from './IdentityFields.vue'

const emit = defineEmits<{
    create: []
    save: []
}>()

const { character, isDirty, saveError } = useCharacterSheet()
</script>

<template>
    <header
        class="flex flex-col gap-4 rounded-xl border border-amber-900/20 bg-amber-50/80 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-5"
    >
        <IdentityFields v-if="character" class="min-w-0 flex-1" />
        <div class="flex min-w-0 flex-col gap-3 sm:items-end">
            <div class="flex flex-wrap gap-2">
                <NButton type="primary" @click="emit('create')">Создать персонажа</NButton>
                <NButton
                    :disabled="!character || !isDirty"
                    :type="isDirty ? 'primary' : 'default'"
                    @click="emit('save')"
                >
                    Сохранить
                </NButton>
                <NButton
                    tag="a"
                    href="https://forms.yandex.ru/u/6aec6367c45c070febaff5f5"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Пройти опрос
                </NButton>
            </div>
            <p v-if="character && !saveError" class="text-sm" aria-live="polite">
                {{ isDirty ? 'Есть несохранённые изменения' : 'Сохранено' }}
            </p>
            <p
                v-else-if="saveError"
                class="text-sm text-red-800"
                role="alert"
                aria-live="assertive"
            >
                {{ saveError }}
            </p>
        </div>
    </header>
</template>
