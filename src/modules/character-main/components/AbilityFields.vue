<script setup lang="ts">
import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'
import { calculateSavingThrowBonus } from '@/domain/savingThrow'
import type { AbilityKey, CharacterAbilities, CharacterSavingThrows } from '@/types/character'
import type { CharacterSavingThrowPatch } from '@/types/character'
import { NTooltip } from 'naive-ui'

type Props = {
    abilities: CharacterAbilities
    savingThrows: CharacterSavingThrows
    level: number
    disabled?: boolean
}

type Emits = {
    update: [key: AbilityKey, value: number]
    'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

function onInput(key: AbilityKey, value: unknown): void {
    const numberValue = Number(value)
    emit('update', key, Number.isFinite(numberValue) ? numberValue : 0)
}

function updateProficiency(key: AbilityKey, proficient: boolean): void {
    emit('update:saving-throw', key, { proficient })
}

function savingThrowLabel(key: AbilityKey): string {
    const bonus = calculateSavingThrowBonus(
        { ability: key, proficient: props.savingThrows[key].proficient },
        props.abilities,
        props.level,
    )
    return bonus === null ? '-' : signedModifier(bonus)
}
</script>

<template>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div v-for="field in ABILITY_FIELDS" :key="field.key">
            <NFormItem content-class="flex-col flex">
                <div class="w-full">
                    <NTooltip>
                        <template #trigger>
                            <NCheckbox :checked="savingThrows[field.key].proficient" :disabled="disabled"
                                @update:checked="updateProficiency(field.key, $event)">
                                {{ field.label }}
                            </NCheckbox>
                        </template>
                        Владение характеристикой
                    </NTooltip>
                </div>
                <NInputNumber button-placement="both" :disabled="disabled" :value="abilities[field.key]"
                    @update:value="onInput(field.key, $event)" />
            </NFormItem>
            <p :title="'Модификатор = ⌊(значение − 10) / 2⌋'">
                Модификатор (расчёт):
                {{ signedModifier(abilityModifier(abilities[field.key])) }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
                <span>
                    Спасбросок: <strong>{{ savingThrowLabel(field.key) }}</strong>
                </span>
            </div>
        </div>
    </div>
</template>
