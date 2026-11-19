<script setup lang="ts">
import { computed } from 'vue'
import { NCollapse, NCollapseItem, NFormItem, NInputNumber, NSelect } from 'naive-ui'

import { useMonsterSheet } from '../../../composables/useMonsterSheet'
import { MONSTER_ABILITY_FIELDS } from '../../../data/monsterFields'
import { calculateSkillBonus, signedModifier } from '../../../domain/abilityBonuses'
import type { MonsterSkillRecord } from '../../../types/monster'
import { getEntryKey } from '../../../utils/getEntryKey'

const { monster } = useMonsterSheet()

const proficiencyOptions: Array<{ value: MonsterSkillRecord['proficiency']; label: string }> = [
    { value: 'none', label: 'Без владения' },
    { value: 'proficient', label: 'Владение (+бонус)' },
    { value: 'expertise', label: 'Экспертиза (×2)' },
]

const abilityOptions = [
    { value: '', label: 'Не выбрана' },
    ...MONSTER_ABILITY_FIELDS.map(field => ({ value: field.key, label: field.label })),
]

const calculationModeOptions = [
    { value: 'computed', label: 'По характеристике' },
    { value: 'manual', label: 'Вручную' },
]

const skillColumns = computed(() => [
    monster.value?.skills.filter((_, index) => index % 2 === 0) ?? [],
    monster.value?.skills.filter((_, index) => index % 2 === 1) ?? [],
])

function numberValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? value : 0
}

function displayBonus(skill: MonsterSkillRecord) {
    if (!monster.value) return '—'
    const bonus = calculateSkillBonus(skill, monster.value.abilityScores, monster.value.level)

    return bonus === null ? '—' : signedModifier(bonus)
}
</script>

<template>
    <div class="grid grid-cols-1 w-full gap-4 sm:grid-cols-2">
        <div v-for="(column, columnIndex) in skillColumns" :key="columnIndex" class="min-w-0">
            <div v-for="skill in column" :key="getEntryKey(skill)" class="py-3">
                <NCollapse arrow-placement="right">
                    <NCollapseItem name="settings">
                        <template #header>
                            <div class="flex gap-2">
                                <span v-if="skill.proficiency !== 'none'">
                                    {{
                                        skill.proficiency === 'expertise'
                                            ? 'Экспертиза'
                                            : 'Владение'
                                    }}
                                </span>
                                <strong class="min-w-0">{{ skill.name }}</strong>
                                <span>{{ displayBonus(skill) }}</span>
                            </div>
                        </template>
                        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <NFormItem
                                label="Связанная характеристика"
                                label-placement="top"
                                :show-feedback="false"
                            >
                                <NSelect
                                    size="small"
                                    :value="skill.ability ?? ''"
                                    :aria-label="`${skill.name}: связанная характеристика`"
                                    :options="abilityOptions"
                                    @update:value="skill.ability = $event || null"
                                />
                            </NFormItem>
                            <NFormItem
                                label="Уровень владения"
                                label-placement="top"
                                :show-feedback="false"
                            >
                                <NSelect
                                    v-model:value="skill.proficiency"
                                    size="small"
                                    :aria-label="`${skill.name}: уровень владения`"
                                    :options="proficiencyOptions"
                                />
                            </NFormItem>
                            <NFormItem
                                label="Как считать бонус"
                                label-placement="top"
                                :show-feedback="false"
                            >
                                <NSelect
                                    v-model:value="skill.calculationMode"
                                    size="small"
                                    :aria-label="`${skill.name}: как считать бонус`"
                                    :options="calculationModeOptions"
                                />
                            </NFormItem>
                            <NFormItem
                                v-if="skill.calculationMode === 'manual'"
                                label="Бонус вручную"
                                label-placement="top"
                                :show-feedback="false"
                            >
                                <NInputNumber
                                    size="small"
                                    button-placement="both"
                                    :input-props="{ 'aria-label': `${skill.name}: бонус вручную` }"
                                    :value="skill.value"
                                    @update:value="skill.value = numberValue($event)"
                                />
                            </NFormItem>
                            <NFormItem
                                v-else
                                label="Дополнительная поправка"
                                label-placement="top"
                                :show-feedback="false"
                            >
                                <NInputNumber
                                    size="small"
                                    button-placement="both"
                                    :input-props="{
                                        'aria-label': `${skill.name}: дополнительная поправка`,
                                    }"
                                    :value="skill.additionalBonus"
                                    @update:value="
                                        skill.additionalBonus = Math.trunc(numberValue($event))
                                    "
                                />
                            </NFormItem>
                        </div>
                    </NCollapseItem>
                </NCollapse>
            </div>
        </div>
    </div>
</template>
