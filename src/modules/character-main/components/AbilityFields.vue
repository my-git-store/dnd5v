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

function updateProficiency(key: AbilityKey, proficient: boolean) {
    if (!character.value) return
    character.value.savingThrows[key].proficient = proficient
    const creation = character.value.extensions.characterCreation
    if (creation && !creation.classSavingThrowKeys.includes(key)) {
        const manualKeys = new Set(creation.manualSavingThrowKeys ?? [])
        if (proficient) manualKeys.add(key)
        else manualKeys.delete(key)
        creation.manualSavingThrowKeys = [...manualKeys]
    }
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
                            <NCheckbox
                                :checked="character.savingThrows[field.key].proficient"
                                @update:checked="updateProficiency(field.key, $event)"
                            >
                                {{ field.label }}
                            </NCheckbox>
                        </template>
                        Владение характеристикой
                    </NTooltip>
                </div>
                <NInputNumber
                    button-placement="both"
                    :value="character.abilities[field.key]"
                    @update:value="character.abilities[field.key] = numberValue($event)"
                />
            </NFormItem>
            <p title="Модификатор = ⌊(значение − 10) / 2⌋">
                Модификатор (расчёт):
                {{ signedModifier(abilityModifier(character.abilities[field.key])) }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
                <span>
                    Спасбросок: <strong>{{ savingThrowLabel(field.key) }}</strong>
                </span>
            </div>
        </div>
    </div>
</template>
