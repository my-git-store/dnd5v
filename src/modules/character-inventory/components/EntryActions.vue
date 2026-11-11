<script setup lang="ts">
type Emits = {
    edit: []
    remove: []
}

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<Emits>()
</script>
<template>
    <div class="c-entry-actions">
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
    </div>
</template>
