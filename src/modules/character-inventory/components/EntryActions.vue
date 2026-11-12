<script setup lang="ts">
type Emits = {
    edit: []
    remove: []
}

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<Emits>()
</script>
<template>
    <div class="flex flex-wrap items-center gap-2">
        <NButton native-type="button" :disabled="disabled" @click="emit('edit')">
            Изменить
        </NButton>
        <NButton native-type="button" :disabled="disabled" @click="emit('remove')">
            Удалить
        </NButton>
    </div>
</template>
