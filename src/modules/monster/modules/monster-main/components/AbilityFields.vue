<script setup lang="ts">
import { NCheckbox, NFormItem, NInputNumber, NTooltip } from 'naive-ui'

import { useMonsterSheet } from '../../../composables/useMonsterSheet'
import { MONSTER_ABILITY_FIELDS } from '../../../data/monsterFields'
import {
    abilityModifier,
    calculateSavingThrowBonus,
    signedModifier,
} from '../../../domain/abilityBonuses'
import type { MonsterAbilityKey } from '../../../types/monster'

const { monster } = useMonsterSheet()

function updateAbilityScore(key: MonsterAbilityKey, value: number | null) {
    if (!monster.value) return
    const ability = monster.value.abilityScores[key]

    ability.score = value !== null && Number.isFinite(value) ? value : 0
    ability.modifier = abilityModifier(ability.score)
}

function savingThrowLabel(key: MonsterAbilityKey) {
    if (!monster.value) return '-'
    const bonus = calculateSavingThrowBonus(monster.value.abilityScores[key], monster.value.level)

    return bonus === null ? '-' : signedModifier(bonus)
}
</script>

<template>
    <section
        v-if="monster"
        aria-label="Характеристики"
        class="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
        <div v-for="field in MONSTER_ABILITY_FIELDS" :key="field.key">
            <NFormItem content-class="flex-col flex">
                <div class="w-full">
                    <NTooltip>
                        <template #trigger>
                            <NCheckbox
                                v-model:checked="monster.abilityScores[field.key].proficient"
                            >
                                {{ field.label }}
                                <div class="flex gap-2">
                                    <div>
                                        Модификатор:
                                        <strong>{{
                                            signedModifier(
                                                abilityModifier(
                                                    monster.abilityScores[field.key].score,
                                                ),
                                            )
                                        }}</strong>
                                    </div>
                                    <div>
                                        Спасбросок:
                                        <strong>{{ savingThrowLabel(field.key) }}</strong>
                                    </div>
                                </div>
                            </NCheckbox>
                        </template>
                        Владение характеристикой
                    </NTooltip>
                </div>
                <NInputNumber
                    button-placement="both"
                    :value="monster.abilityScores[field.key].score"
                    :input-props="{ 'aria-label': `${field.label}: значение` }"
                    @update:value="updateAbilityScore(field.key, $event)"
                />
            </NFormItem>
        </div>
    </section>
</template>
