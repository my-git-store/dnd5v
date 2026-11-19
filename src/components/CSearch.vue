<script setup lang="ts">
import { NFormItem, NInput } from 'naive-ui'

type Emits = {
    'update:query': [value: string]
}

defineProps<{ label: string; query: string }>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div>
        <NFormItem :label="label">
            <NInput
                :value="query"
                clearable
                @clear="emit('update:query', '')"
                @update:value="emit('update:query', $event.trim())"
            />
        </NFormItem>
    </div>
</template>
