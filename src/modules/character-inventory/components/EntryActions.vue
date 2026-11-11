<script setup lang="ts">
defineProps<{ editing?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ edit: []; remove: []; save: []; cancel: [] }>()
</script>
<template>
    <div class="c-entry-actions">
        <template v-if="editing">
            <button type="button" class="c-text-button" :disabled="disabled" @click="emit('save')">
                Применить
            </button>
            <button
                type="button"
                class="c-text-button muted"
                :disabled="disabled"
                @click="emit('cancel')"
            >
                Отмена
            </button>
        </template>
        <template v-else>
            <button type="button" class="c-text-button" :disabled="disabled" @click="emit('edit')">
                Изменить
            </button>
            <button
                type="button"
                class="c-text-button danger"
                :disabled="disabled"
                @click="emit('remove')"
            >
                Удалить
            </button>
        </template>
    </div>
</template>
