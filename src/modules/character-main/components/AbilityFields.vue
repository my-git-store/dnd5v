<script setup lang="ts">
import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'
import { calculateSavingThrowBonus } from '@/domain/savingThrow'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { AbilityKey } from '@/types/character'
import { NCheckbox, NFormItem, NInputNumber, NTooltip } from 'naive-ui'

const { character } = useCharacterSheet()

function numberValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? value : 0
}

function savingThrowLabel(key: AbilityKey) {
    if (!character.value) return '-'
    const bonus = calculateSavingThrowBonus(
        { ability: key, proficient: character.value.savingThrows[key].proficient },
        character.value.abilities,
        character.value.identity.level,
    )
    return bonus === null ? '-' : signedModifier(bonus)
}
</script>

<template>
    <div v-if="character" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div v-for="field in ABILITY_FIELDS" :key="field.key">
            <NFormItem content-class="flex-col flex">
                <div class="w-full">
                    <NTooltip>
                        <template #trigger>
                            <NCheckbox v-model:checked="character.savingThrows[field.key].proficient">
                                {{ field.label }}
                                <div class="flex gap-2">
                                    <div> Модификатор:
                                        <strong>{{ signedModifier(abilityModifier(character.abilities[field.key]))
                                            }}</strong>
                                    </div>
                                    <div>Спасбросок: <strong>{{ savingThrowLabel(field.key) }}</strong></div>
                                </div>
                            </NCheckbox>
                        </template>
                        Владение характеристикой
                    </NTooltip>
                </div>
                <NInputNumber button-placement="both" :value="character.abilities[field.key]"
                    @update:value="character.abilities[field.key] = numberValue($event)" />
            </NFormItem>
        </div>
    </div>
</template>
