<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NCheckbox, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { getAdditionalAttackBonus } from '@/domain/attackBonus'
import type { CharacterAttackRecord } from '@/types/character'

type Emits = {
    save: [attack: CharacterAttackRecord]
    cancel: []
}

const props = defineProps<{
    attack: CharacterAttackRecord
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const attackKinds = [
    { value: 'melee', label: 'Ближняя' },
    { value: 'ranged', label: 'Дальняя' },
    { value: 'spell', label: 'Заклинание' },
    { value: 'other', label: 'Другое' },
]

const abilityOptions = ABILITY_FIELDS.map(field => ({ value: field.key, label: field.label }))

function createDraft(attack: CharacterAttackRecord): CharacterAttackRecord {
    return {
        ...attack,
        additionalBonus: getAdditionalAttackBonus(attack),
    }
}

const draft = ref(createDraft(props.attack))

watch(
    () => props.attack,
    value => {
        draft.value = createDraft(value)
    },
    { deep: true },
)

function updateAdditionalBonus(value: number | null) {
    draft.value.additionalBonus = getAdditionalAttackBonus({ additionalBonus: value })
}

function submit() {
    const name = draft.value.name.trim()
    if (!name) return

    emit('save', {
        ...createDraft(draft.value),
        name,
    })
}
</script>

<template>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NFormItem label="Название">
            <NInput v-model:value="draft.name" :disabled="disabled" />
        </NFormItem>
        <label class="grid gap-2">Тип атаки
            <NSelect v-model:value="draft.kind" class="w-full" :options="attackKinds" :disabled="disabled" />
        </label>
        <NFormItem label="Характеристика для атаки">
            <NSelect
                v-model:value="draft.ability"
                :options="abilityOptions"
                :disabled="disabled"
                clearable
                placeholder="Без характеристики"
                aria-label="Характеристика для атаки"
            />
        </NFormItem>
        <label class="flex flex-wrap items-center gap-2">
            <NCheckbox v-model:checked="draft.proficient" :disabled="disabled">Добавлять бонус владения</NCheckbox>
        </label>
        <NFormItem label="Дополнительный бонус">
            <NInputNumber
                button-placement="both"
                step="1"
                :value="draft.additionalBonus"
                :disabled="disabled"
                @update:value="updateAdditionalBonus"
            />
        </NFormItem>
        <NFormItem label="Урон">
            <NInputNumber
                button-placement="both"
                :min="0"
                :value="draft.damage"
                :disabled="disabled"
                @update:value="draft.damage = $event ?? 0"
            />
        </NFormItem>
        <NFormItem label="Тип урона">
            <NInput v-model:value="draft.damageType" :disabled="disabled" />
        </NFormItem>
        <NFormItem label="Дистанция">
            <NInputNumber
                button-placement="both"
                :min="0"
                :value="draft.range"
                :disabled="disabled"
                @update:value="draft.range = $event ?? 0"
            />
        </NFormItem>
        <NFormItem label="Описание">
            <NInput v-model:value="draft.description" type="textarea" :disabled="disabled" rows="2" />
        </NFormItem>
        <div class="flex flex-wrap items-center gap-2">
            <NButton type="primary" :disabled="disabled" @click="submit">Применить</NButton>
            <NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>
