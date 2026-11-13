<script setup lang="ts">
import { computed } from 'vue'
import { NCollapse, NCollapseItem, NFormItem, NInputNumber, NSelect } from 'naive-ui'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '@/domain/skillBonus'
import { signedModifier } from '@/domain/abilityModifier'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type {
    AbilityKey,
    CharacterSkillRecord,
    SkillProficiency,
    SkillProficiencySource,
} from '@/types/character'

const { character } = useCharacterSheet()

const characterCreation = computed(() => character.value?.extensions.characterCreation)

const raceSkillIds = computed(() => [
    ...(characterCreation.value?.raceSkillIds ?? []),
    ...(characterCreation.value?.subraceSkillIds ?? []),
])

const backgroundSkillIds = computed(() => [
    ...(characterCreation.value?.backgroundSkillIds ?? []),
    ...(character.value?.identity.background.skillProficiencies ?? []),
])

const abilityLabels = Object.fromEntries(
    ABILITY_FIELDS.map(field => [field.key, field.label]),
)

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

const sourceLabels: Record<SkillProficiencySource, string> = {
    race: 'Вид',
    class: 'Класс',
    background: 'Предыстория',
    feat: 'Черта',
    manual: 'Вручную',
}

const abilityShortLabels: Record<AbilityKey, string> = {
    strength: 'СИЛ',
    dexterity: 'ЛОВ',
    constitution: 'ТЕЛ',
    intelligence: 'ИНТ',
    wisdom: 'МДР',
    charisma: 'ХАР',
}

const skillColumns = computed(() => [
    character.value?.skills.filter((_, index) => index % 2 === 0) ?? [],
    character.value?.skills.filter((_, index) => index % 2 === 1) ?? [],
])

function numberValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? value : 0
}

function displayBonus(skill: CharacterSkillRecord) {
    if (!character.value) return '—'
    const bonus = calculateSkillBonus(skill, character.value.abilities, character.value.identity.level)
    return bonus === null ? '—' : signedModifier(bonus)
}
function skillSourceLabel(skill: CharacterSkillRecord) {
    const sources = skill.proficiencySources ?? []

    if (!skill.proficiencySources && skill.proficiency !== 'none') {
        if (raceSkillIds.value.includes(skill.id)) sources.push('race')
        if (characterCreation.value?.classSkillIds.includes(skill.id)) sources.push('class')
        if (backgroundSkillIds.value.includes(skill.id)) sources.push('background')
        if (!sources.length) sources.push('manual')
    }

    return sources.length
        ? `Источник: ${sources.map(source => sourceLabels[source]).join(' · ')}`
        : 'Без источника владения'
}
</script>

<template>
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Навыки</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="(column, columnIndex) in skillColumns" :key="columnIndex" class="min-w-0">
                <div v-for="skill in column" :key="skill.id" class="py-3">
                    <div class="flex flex-wrap items-center gap-2">
                        <span v-if="skill.proficiency !== 'none'">
                            {{ skill.proficiency === 'expertise' ? 'Экспертиза' : 'Владение' }}
                        </span>
                        <strong class="min-w-0">{{ skill.name }}</strong>
                        <span
                            :title="
                                skill.ability
                                    ? abilityLabels[skill.ability]
                                    : 'Характеристика не выбрана'
                            "
                            >{{ skill.ability ? abilityShortLabels[skill.ability] : '—' }}</span
                        >
                        <span>{{ displayBonus(skill) }}</span>
                        <span>{{
                            getSkillCalculationMode(skill) === 'manual' ? 'Вручную' : 'Расчёт'
                        }}</span>
                    </div>
                    <NCollapse arrow-placement="right">
                        <NCollapseItem :name="skill.id">
                            <template #header="{ collapsed }">
                                <button
                                    type="button"
                                    class="flex flex-1 items-center justify-between gap-3"
                                    :aria-expanded="!collapsed"
                                    :aria-label="`${skill.name}: настроить`"
                                >
                                    <span class="min-w-0">{{ skillSourceLabel(skill) }}</span>
                                    <span>Настроить</span>
                                </button>
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
                                        @update:value="skill.additionalBonus = Math.trunc(numberValue($event))"
                                    />
                                </NFormItem>
                            </div>
                        </NCollapseItem>
                    </NCollapse>
                </div>
            </div>
        </div>
    </section>
</template>
