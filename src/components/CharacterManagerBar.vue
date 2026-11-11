<script setup lang="ts">
import type { StoredCharacterSummary } from '../api/characterStorage'

defineProps<{
    characters: StoredCharacterSummary[]
    activeId: string | null
    dirty: boolean
    disabled: boolean
    status?: { kind: 'success' | 'error'; text: string } | null
}>()

const emit = defineEmits<{
    select: [id: string]
    create: []
    'create-npc': []
    copy: []
    remove: []
    'export-current': []
    'export-all': []
    'import-file': [file: File]
}>()
</script>

<template>
    <section class="character-manager" aria-label="Управление персонажами">
        <div class="character-manager-copy">
            <span class="c-eyebrow">Персонажи</span>
            <strong v-if="characters.length">Текущий лист персонажа</strong>
            <strong v-else>Персонажей пока нет</strong>
            <small v-if="dirty">Есть несохранённые изменения.</small>
        </div>
        <div class="character-manager-controls">
            <NButton type="default" :disabled="disabled" @click="emit('create')"
                >Создать персонажа</NButton
            >
            <NButton
                type="default"
                tag="a"
                href="https://forms.yandex.ru/u/6aec6367c45c070febaff5f5"
                target="_blank"
                rel="noopener noreferrer"
                >Пройти опрос</NButton
            >
        </div>
        <p
            v-if="status"
            class="character-manager-status"
            :class="status.kind"
            role="status"
            aria-live="polite"
        >
            {{ status.text }}
        </p>
    </section>
</template>

<style scoped>
.character-manager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
    padding: 12px 15px;
    border: 1px solid var(--sheet-line);
    border-radius: 12px;
    background: rgba(255, 249, 235, 0.78);
    box-shadow: 0 4px 14px rgba(83, 59, 38, 0.06);
}
.character-manager-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
}
.character-manager-copy .c-eyebrow {
    margin: 0;
    font-size: 0.62rem;
}
.character-manager-copy strong {
    color: var(--sheet-ink);
    font-family: var(--font-serif);
}
.character-manager-copy small {
    color: var(--sheet-muted);
    font-size: 0.74rem;
}
.character-manager-controls {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 7px;
    min-width: 0;
}
.character-manager-status {
    flex-basis: 100%;
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.78rem;
}
.character-manager-status.success {
    color: var(--sheet-success);
    background: #edf5eb;
}
.character-manager-status.error {
    color: var(--sheet-danger);
    background: #fff0ed;
}
</style>
