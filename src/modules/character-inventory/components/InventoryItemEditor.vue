<script setup lang="ts">
import { ref, watch } from 'vue'

import { RULES_2024_WEAPONS } from '@/data/rules2024/index.ts'
import type { CharacterInventoryItemRecord } from '@/types/character'

const props = defineProps<{ item: CharacterInventoryItemRecord; disabled?: boolean }>()

const emit = defineEmits<{ save: [item: CharacterInventoryItemRecord]; cancel: [] }>()

const weaponOptions = [
    { value: '', label: 'Не оружие / без связи' },
    ...RULES_2024_WEAPONS.map(weapon => ({ value: weapon.id, label: weapon.name })),
]

const draft = ref<CharacterInventoryItemRecord>({
    ...props.item,
    properties: [...props.item.properties],
})
watch(
    () => props.item,
    value => {
        draft.value = { ...value, properties: [...value.properties] }
    },
    { deep: true },
)
function integer(value: unknown) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
}
function weight(value: unknown) {
    if (value === '' || value === null || value === undefined) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null
}
function updateProperties(value: unknown) {
    draft.value.properties = String(value ?? '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
}
function updateWeapon(value: string | null) {
    const id = value ?? ''
    draft.value.weaponId = id || undefined
}
function submit() {
    if (!draft.value.name.trim()) return
    emit('save', {
        ...draft.value,
        name: draft.value.name.trim(),
        quantity: integer(draft.value.quantity),
        weight: weight(draft.value.weight),
        properties: [...draft.value.properties],
    })
}
</script>

<template>
    <div class="c-editor-grid">
        <NFormItem label="Название"
            ><NInput v-model:value="draft.name" :disabled="disabled"
        /></NFormItem>
        <label class="c-compact-field"
            >Связь с оружием
            <NSelect
                class="c-select-control"
                :value="draft.weaponId ?? ''"
                :options="weaponOptions"
                :disabled="disabled"
                @update:value="updateWeapon"
            />
        </label>
        <NFormItem label="Количество"
            ><NInputNumber v-model:value="draft.quantity" min="0" step="1" :disabled="disabled"
        /></NFormItem>
        <NFormItem label="Вес"
            ><NInputNumber
                min="0"
                step="0.01"
                :value="draft.weight ?? null"
                :disabled="disabled"
                @update:value="draft.weight = weight($event)"
        /></NFormItem>
        <label class="c-check-control inventory-check"
            ><NCheckbox v-model:checked="draft.equipped" :disabled="disabled"
                >Экипировано</NCheckbox
            ></label
        >
        <NFormItem label="Свойства через запятую"
            ><NInput
                :value="draft.properties.join(', ')"
                :disabled="disabled"
                @update:value="updateProperties"
        /></NFormItem>
        <NFormItem label="Описание"
            ><NInput
                v-model:value="draft.description"
                type="textarea"
                :disabled="disabled"
                rows="3"
        /></NFormItem>
        <div class="c-editor-actions">
            <NButton type="primary" :disabled="disabled" @click="submit">Применить</NButton
            ><NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>

<style scoped>
.inventory-check {
    align-self: end;
    min-height: 38px;
}
</style>
