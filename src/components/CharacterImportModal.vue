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
        <section class="character-import-modal" role="dialog" aria-modal="true"
            aria-label="Импорт персонажей">
            <h2>Импорт персонажей</h2>
            <p>
                Найдено персонажей: <strong>{{ characters.length }}</strong>. Текущие данные не изменятся до
                подтверждения действия.
            </p>
            <ul class="character-import-preview">
                <li v-for="character in characters" :key="character.id">
                    <strong>{{ character.identity.name || 'Безымянный герой' }}</strong>
                </li>
            </ul>
            <div class="c-editor-actions">
                <NButton type="default" @click="emit('close')">Отмена</NButton>
                <NButton :disabled="!currentAvailable" @click="importCharacters('replace')">Заменить текущего</NButton>
                <NButton type="primary" @click="importCharacters('add')">Добавить как новых</NButton>
            </div>
        </section>
    </NModal>
</template>

<style scoped>
.character-import-modal {
    width: min(620px, calc(100vw - 28px));
    box-sizing: border-box;
}

.character-import-modal h2 {
    margin-top: 0;
}

.character-import-modal>p {
    color: var(--sheet-muted);
}

.character-import-preview {
    display: grid;
    gap: 7px;
    max-height: 260px;
    overflow: auto;
    margin: 14px 0;
    padding: 0;
    list-style: none;
}

.character-import-preview li {
    display: grid;
    gap: 2px;
    padding: 9px 11px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 8px;
    background: rgba(255, 248, 231, 0.76);
}

.character-import-preview span {
    color: var(--sheet-muted);
    font-size: 0.78rem;
}
</style>
