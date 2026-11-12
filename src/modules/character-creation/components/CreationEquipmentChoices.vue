<script setup lang="ts">
import type { RuleEquipmentOption } from '@/types/rules'

type Props = {
    options: RuleEquipmentOption[]
    selectedId: string
    disabled?: boolean
    itemCountLabel?: string
}
type Emits = { select: [id: string] }
withDefaults(defineProps<Props>(), { itemCountLabel: 'позиций' })
const emit = defineEmits<Emits>()
</script>

<template>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NButton v-for="kit in options" :key="kit.id" :type="selectedId === kit.id ? 'primary' : 'default'"
            native-type="button" class="h-auto! whitespace-normal!" :aria-pressed="selectedId === kit.id"
            :disabled="disabled" @click="emit('select', kit.id)">
            <span class="flex w-full items-center justify-between gap-2"><span v-if="selectedId === kit.id"
                    aria-label="Выбрано">✓</span></span>
            <strong>{{ kit.label }}</strong>
            <span>{{kit.items.map(item => `${item.name} × ${item.quantity}`).join(' · ')}}</span>
            <span>{{ kit.items.length }} {{ itemCountLabel }}</span>
        </NButton>
    </div>
</template>
