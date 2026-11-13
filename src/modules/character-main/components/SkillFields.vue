<script setup lang="ts">
import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '@/domain/skillBonus'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities, SkillProficiency } from '@/types/character'
import type { SkillProficiencySource } from '@/types/character'
import type { CharacterSkillPatch, CharacterSkillRecord } from '@/types/character'

type Emits = {
    update: [id: string, patch: CharacterSkillPatch]
}

const props = defineProps<{
    skills: CharacterSkillRecord[]
    abilities: CharacterAbilities
    level: number
    classSkillIds?: string[]
    raceSkillIds?: string[]
    backgroundSkillIds?: string[]
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const abilityLabels = Object.fromEntries(
    ABILITY_FIELDS.map(field => [field.key, field.label]),
) as Record<AbilityKey, string>

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
    props.skills.filter((_, index) => index % 2 === 0),
    props.skills.filter((_, index) => index % 2 === 1),
])

function updateValue(id: string, value: unknown) {
    const parsed = Number(value)
    emit('update', id, { value: Number.isFinite(parsed) ? parsed : 0 })
}
function updateAdditional(id: string, value: unknown) {
    const parsed = Number(value)
    emit('update', id, { additionalBonus: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
}
function updateAbility(id: string, value: string | null) {
    emit('update', id, { ability: value ? (value as AbilityKey) : null })
}
function updateProficiency(id: string, value: string | null) {
    emit('update', id, { proficiency: value as SkillProficiency })
}
function updateMode(id: string, value: string | null) {
    emit('update', id, { calculationMode: value === 'computed' ? 'computed' : 'manual' })
}
function displayBonus(skill: CharacterSkillRecord) {
    const bonus = calculateSkillBonus(skill, props.abilities, props.level)
    return bonus === null ? '—' : signedModifier(bonus)
}
function skillSources(skill: CharacterSkillRecord): SkillProficiencySource[] {
    if (skill.proficiencySources) return skill.proficiencySources
    if (skill.proficiency === 'none') return []
    const sources: SkillProficiencySource[] = []
    if (props.raceSkillIds?.includes(skill.id)) sources.push('race')
    if (props.classSkillIds?.includes(skill.id)) sources.push('class')
    if (props.backgroundSkillIds?.includes(skill.id)) sources.push('background')
    if (!sources.length) sources.push('manual')
    return sources
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
                                    <span v-if="skillSources(skill).length" class="min-w-0"
                                        >Источник:
                                        {{
                                            skillSources(skill)
                                                .map(source => sourceLabels[source])
                                                .join(' · ')
                                        }}</span
                                    >
                                    <span v-else class="min-w-0">Без источника владения</span>
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
                                        :disabled="disabled"
                                        @update:value="updateAbility(skill.id, $event)"
                                    />
                                </NFormItem>
                                <NFormItem
                                    label="Уровень владения"
                                    label-placement="top"
                                    :show-feedback="false"
                                >
                                    <NSelect
                                        size="small"
                                        :value="skill.proficiency"
                                        :aria-label="`${skill.name}: уровень владения`"
                                        :options="proficiencyOptions"
                                        :disabled="disabled"
                                        @update:value="updateProficiency(skill.id, $event)"
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
                                        :disabled="disabled"
                                        @update:value="updateMode(skill.id, $event)"
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
                                        :disabled="disabled"
                                        :value="skill.value"
                                        @update:value="updateValue(skill.id, $event)"
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
                                        :disabled="disabled"
                                        :value="skill.additionalBonus"
                                        @update:value="updateAdditional(skill.id, $event)"
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
