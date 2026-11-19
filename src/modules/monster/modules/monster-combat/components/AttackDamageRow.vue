<script setup lang="ts">
import { NButton, NCheckbox, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'

import { MONSTER_ABILITY_FIELDS } from '../../../data/monsterFields'
import type { MonsterAttackDamageRecord } from '../../../types/monster'

const damage = defineModel<MonsterAttackDamageRecord['damage']>('damage', { required: true })

const damageType = defineModel<MonsterAttackDamageRecord['damageType']>('damageType', {
    required: true,
})

const additionalDamage = defineModel<MonsterAttackDamageRecord['additionalDamage']>(
    'additionalDamage',
    { required: true },
)

const ability = defineModel<MonsterAttackDamageRecord['ability']>('ability', { required: true })

const proficient = defineModel<MonsterAttackDamageRecord['proficient']>('proficient', {
    required: true,
})

const emit = defineEmits<{ remove: [] }>()

const abilityOptions = MONSTER_ABILITY_FIELDS.map(field => ({
    value: field.key,
    label: field.label,
}))

function updateAdditionalDamage(value: number | null) {
    additionalDamage.value = Math.trunc(value ?? 0)
}
</script>

<template>
    <div class="flex flex-wrap items-end gap-3">
        <NFormItem label="Урон" :show-feedback="false" class="min-w-40 flex-1">
            <NInput
                :value="damage"
                placeholder="Например, 1d8"
                :input-props="{ 'aria-label': 'Урон' }"
                @update:value="damage = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Тип урона" :show-feedback="false" class="min-w-40 flex-1">
            <NInput
                :value="damageType"
                :input-props="{ 'aria-label': 'Тип урона' }"
                @update:value="damageType = $event.trim()"
            />
        </NFormItem>
        <NFormItem label="Дополнительный урон" :show-feedback="false" class="min-w-40 flex-1">
            <NInputNumber
                :value="additionalDamage"
                :precision="0"
                button-placement="both"
                class="w-full"
                :input-props="{ 'aria-label': 'Дополнительный урон' }"
                @update:value="updateAdditionalDamage"
            />
        </NFormItem>
        <NFormItem label="Характеристика урона" :show-feedback="false" class="min-w-40 flex-1">
            <NSelect
                v-model:value="ability"
                :options="abilityOptions"
                clearable
                placeholder="Без характеристики"
                aria-label="Характеристика урона"
            />
        </NFormItem>
        <NButton aria-label="Удалить строку урона" @click="emit('remove')">Удалить</NButton>
        <NCheckbox v-model:checked="proficient">Добавлять бонус владения</NCheckbox>
    </div>
</template>
