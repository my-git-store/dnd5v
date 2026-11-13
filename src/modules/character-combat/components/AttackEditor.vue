<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NCheckbox, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'

import { ATTACK_BONUS_SOURCES } from '@/data/characterFields'
import {
    getRules2024Weapon,
    RULES_2024_WEAPON_MASTERIES,
    RULES_2024_WEAPONS,
} from '@/data/rules2024/index.ts'
import { getAttackBonusSource, getAdditionalAttackBonus } from '@/domain/attackBonus'
import type { CharacterAbilities } from '@/types/character'
import type { CharacterAttackRecord } from '@/types/character'

type Emits = {
    save: [attack: CharacterAttackRecord]
    cancel: []
}

const props = defineProps<{
    attack: CharacterAttackRecord
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const attackKinds = [
    { value: 'melee', label: 'Ближняя' },
    { value: 'ranged', label: 'Дальняя' },
    { value: 'spell', label: 'Заклинание' },
    { value: 'other', label: 'Другое' },
]

const weaponOptions = [
    { value: '', label: 'Без связи' },
    ...RULES_2024_WEAPONS.map(weapon => ({
        value: weapon.id,
        label: `${weapon.name} (${weapon.category === 'melee' ? 'ближнее' : 'дальнее'})`,
    })),
]

const masteryOptions = [
    { value: '', label: 'Не указано' },
    ...RULES_2024_WEAPON_MASTERIES.map(mastery => ({ value: mastery.id, label: mastery.name })),
]

const bonusSourceOptions = ATTACK_BONUS_SOURCES.map(source => ({
    value: source.value,
    label: source.label,
}))

const calculationModeOptions = [
    { value: 'manual', label: 'Ручной' },
    { value: 'computed', label: 'Расчёт' },
]

function createDraft(attack: CharacterAttackRecord): CharacterAttackRecord {
    return {
        ...attack,
        properties: [...attack.properties],
        abilitySource: getAttackBonusSource(attack),
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
function numberValue(value: unknown) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
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
    draft.value.masteryId = id ? (getRules2024Weapon(id)?.mastery ?? undefined) : undefined
}
function updateMastery(value: string | null) {
    const id = value ?? ''
    draft.value.masteryId = id || undefined
}
function submit() {
    if (!draft.value.name.trim()) return
    emit('save', {
        ...draft.value,
        name: draft.value.name.trim(),
        properties: [...draft.value.properties],
        weaponId: draft.value.weaponId || undefined,
        masteryId: draft.value.masteryId || undefined,
        abilitySource: getAttackBonusSource(draft.value),
        additionalBonus: getAdditionalAttackBonus(draft.value),
    })
}
</script>

<template>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NFormItem label="Название"
            ><NInput v-model:value="draft.name" :disabled="disabled"
        /></NFormItem>
        <label class="grid gap-2"
            >Тип атаки
            <NSelect
                v-model:value="draft.kind"
                class="w-full"
                :options="attackKinds"
                :disabled="disabled"
            />
        </label>
        <label class="grid gap-2"
            >Оружие из справочника
            <NSelect
                class="w-full"
                :value="draft.weaponId ?? ''"
                :options="weaponOptions"
                :disabled="disabled"
                @update:value="updateWeapon"
            />
        </label>
        <label class="grid gap-2"
            >Мастерство (данные)
            <NSelect
                class="w-full"
                :value="draft.masteryId ?? ''"
                :options="masteryOptions"
                :disabled="disabled"
                @update:value="updateMastery"
            />
        </label>
        <NFormItem label="Ручной бонус атаки"
            ><NInput
                v-model:value="draft.attackBonus"
                :disabled="disabled || draft.calculationMode !== 'manual'"
        /></NFormItem>
        <label class="grid gap-2"
            >Источник способности
            <NSelect
                v-model:value="draft.abilitySource"
                class="w-full"
                :options="bonusSourceOptions"
                :disabled="disabled"
            />
        </label>
        <label class="grid gap-2"
            >Режим бонуса
            <NSelect
                v-model:value="draft.calculationMode"
                class="w-full"
                :options="calculationModeOptions"
                :disabled="disabled"
            />
        </label>
        <label class="flex flex-wrap items-center gap-2"
            ><NCheckbox v-model:checked="draft.proficient" :disabled="disabled"
                >Добавлять бонус владения</NCheckbox
            ></label
        >
        <NFormItem label="Дополнительный бонус"
            ><NInputNumber
                button-placement="both"
                step="1"
                :value="draft.additionalBonus"
                :disabled="disabled"
                @update:value="draft.additionalBonus = numberValue($event)"
        /></NFormItem>
        <NFormItem label="Урон"
            ><NInput v-model:value="draft.damage" :disabled="disabled"
        /></NFormItem>
        <NFormItem label="Тип урона"
            ><NInput v-model:value="draft.damageType" :disabled="disabled"
        /></NFormItem>
        <NFormItem label="Дистанция"
            ><NInput v-model:value="draft.range" :disabled="disabled"
        /></NFormItem>
        <NFormItem label="Текстовое мастерство (старый формат)"
            ><NInput
                v-if="!draft.weaponId"
                v-model:value="draft.weaponMastery"
                :disabled="disabled"
        /></NFormItem>
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
                rows="2"
        /></NFormItem>
        <div class="flex flex-wrap items-center gap-2">
            <NButton type="primary" :disabled="disabled" @click="submit">Применить</NButton
            ><NButton :disabled="disabled" @click="emit('cancel')">Отмена</NButton>
        </div>
    </div>
</template>
