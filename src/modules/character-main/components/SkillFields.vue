<script setup lang="ts">
import { computed } from 'vue'
import { NCollapse, NCollapseItem, NFormItem, NInputNumber, NSelect } from 'naive-ui'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '@/domain/skillBonus'
import { signedModifier } from '@/domain/abilityModifier'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { getEntryKey } from '@/utils/getEntryKey'
import type { CharacterSkillRecord, SkillProficiency } from '@/types/character'

const { character } = useCharacterSheet()

const proficiencyOptions: Array<{ value: SkillProficiency; label: string }> = [
    { value: 'none', label: 'Без владения' },
    { value: 'proficient', label: 'Владение (+бонус)' },
    { value: 'expertise', label: 'Экспертиза (×2)' },
]

const abilityOptions = [
    { value: '', label: 'Не выбрана' },
    ...ABILITY_FIELDS.map(field => ({ value: field.key, label: field.label })),
]

const calculationModeOptions = [
    { value: 'computed', label: 'По характеристике' },
    { value: 'manual', label: 'Вручную' },
]

const skillColumns = computed(() => [
    character.value?.skills.filter((_, index) => index % 2 === 0) ?? [],
    character.value?.skills.filter((_, index) => index % 2 === 1) ?? [],
])

function numberValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? value : 0
}

function displayBonus(skill: CharacterSkillRecord) {
    if (!character.value) return '—'
    const bonus = calculateSkillBonus(
        skill,
        character.value.abilities,
        character.value.identity.level,
    )
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
                            <div
                                class="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_3.25rem] items-center gap-2"
                            >
                                <div class="flex min-w-0 items-center gap-2">
                                    <span
                                        v-if="skill.proficiency !== 'none'"
                                        class="shrink-0 text-xs"
                                    >
                                        {{
                                            skill.proficiency === 'expertise'
                                                ? 'Экспертиза'
                                                : 'Владение'
                                        }}
                                    </span>
                                    <strong class="min-w-0 truncate" :title="skill.name">{{
                                        skill.name
                                    }}</strong>
                                </div>
                                <span class="w-full text-right font-semibold tabular-nums">{{
                                    displayBonus(skill)
                                }}</span>
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
                                    size="small"
                                    :value="getSkillCalculationMode(skill)"
                                    :aria-label="`${skill.name}: как считать бонус`"
                                    :options="calculationModeOptions"
                                    @update:value="skill.calculationMode = $event"
                                />
                            </NFormItem>
                            <NFormItem
                                v-if="getSkillCalculationMode(skill) === 'manual'"
                                label="Бонус вручную"
                                label-placement="top"
                                :show-feedback="false"
                            >
                                <NInputNumber
                                    size="small"
                                    button-placement="both"
                                    :aria-label="`${skill.name}: бонус вручную`"
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
                                    :aria-label="`${skill.name}: дополнительная поправка`"
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
