<script setup lang="ts">
import type { Character } from '../types/character'

export type Props = {
    characters: Character[]
    currentAvailable: boolean
    onImport: (mode: 'add' | 'replace') => void | Promise<void>
}

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

async function importCharacters(mode: 'add' | 'replace') {
    await props.onImport(mode)
    emit('close')
}
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')">
        <NCard
            class="w-full max-w-xl max-h-[90vh] overflow-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Импорт персонажей"
        >
            <h2>Импорт персонажей</h2>
            <p>
                Найдено персонажей: <strong>{{ characters.length }}</strong
                >. Текущие данные не изменятся до подтверждения действия.
            </p>
            <ul>
                <li v-for="character in characters" :key="character.id">
                    <strong>{{ character.identity.name || 'Безымянный герой' }}</strong>
                </li>
            </ul>
            <div class="flex flex-wrap items-center gap-2">
                <NButton type="default" @click="emit('close')">Отмена</NButton>
                <NButton :disabled="!currentAvailable" @click="importCharacters('replace')"
                    >Заменить текущего</NButton
                >
                <NButton type="primary" @click="importCharacters('add')"
                    >Добавить как новых</NButton
                >
            </div>
        </NCard>
    </NModal>
</template>
