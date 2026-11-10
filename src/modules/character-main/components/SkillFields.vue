<script setup lang="ts">
import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/modules/character-sheet/data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '@/modules/character-sheet/domain/skillBonus'
import { signedModifier } from '@/modules/character-sheet/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities, SkillProficiency } from '@/modules/character-sheet/types/character'
import type { SkillProficiencySource } from '@/modules/character-sheet/types/character'
import type { CharacterSkillPatch, CharacterSkillView } from '@/modules/character-sheet/types/characterView'

const props = defineProps<{
    skills: CharacterSkillView[]
    abilities: CharacterAbilities
    level: number
    classSkillIds?: string[]
    raceSkillIds?: string[]
    backgroundSkillIds?: string[]
    disabled?: boolean
}>()

const emit = defineEmits<{ update: [id: string, patch: CharacterSkillPatch] }>()

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
function displayBonus(skill: CharacterSkillView) {
    const bonus = calculateSkillBonus(skill, props.abilities, props.level)
    return bonus === null ? '—' : signedModifier(bonus)
}
function skillSources(skill: CharacterSkillView): SkillProficiencySource[] {
    if (skill.proficiencySources?.length) return skill.proficiencySources
    const sources: SkillProficiencySource[] = []
    if (props.raceSkillIds?.includes(skill.id)) sources.push('race')
    if (props.classSkillIds?.includes(skill.id)) sources.push('class')
    if (props.backgroundSkillIds?.includes(skill.id)) sources.push('background')
    return sources
}
</script>

<template>
    <section class="sheet-section skills-panel">
        <div class="section-heading section-heading-stack">
            <div>
                <h2>Навыки</h2>
                <p class="section-note">
                    Связь навыка с характеристикой обычно задана правилами. Владение добавляется
                    источниками, а бонус можно ввести вручную или считать автоматически.
                </p>
            </div>
        </div>
        <div class="skills-grid">
            <div
                v-for="(column, columnIndex) in skillColumns"
                :key="columnIndex"
                class="skills-column"
            >
                <div v-for="skill in column" :key="skill.id" class="skill-row">
                    <div class="skill-row-summary">
                        <span
                            class="skill-proficiency-dot"
                            :class="{ active: skill.proficiency !== 'none' }"
                            aria-hidden="true"
                        ></span>
                        <strong class="skill-name">{{ skill.name }}</strong>
                        <span
                            class="skill-ability-code"
                            :title="
                                skill.ability
                                    ? abilityLabels[skill.ability]
                                    : 'Характеристика не выбрана'
                            "
                            >{{ skill.ability ? abilityShortLabels[skill.ability] : '—' }}</span
                        >
                        <span class="skill-bonus-pill">{{ displayBonus(skill) }}</span>
                        <span
                            class="skill-calculation-mode"
                            :class="
                                getSkillCalculationMode(skill) === 'manual' ? 'manual' : 'computed'
                            "
                            >{{
                                getSkillCalculationMode(skill) === 'manual' ? 'Вручную' : 'Расчёт'
                            }}</span
                        >
                    </div>
                    <div class="skill-row-meta">
                        <span v-if="skillSources(skill).length" class="skill-source-inline"
                            >Источник:
                            {{
                                skillSources(skill)
                                    .map(source => sourceLabels[source])
                                    .join(' · ')
                            }}</span
                        >
                        <span v-else class="skill-source-inline muted">Без источника владения</span>
                        <details class="skill-settings">
                            <summary>Настроить</summary>
                            <div class="skill-controls">
                                <label class="compact-field"
                                    >Связанная характеристика
                                    <NSelect
                                        class="select-control"
                                        :value="skill.ability ?? ''"
                                        :options="abilityOptions"
                                        :disabled="disabled"
                                        @update:value="updateAbility(skill.id, $event)"
                                    />
                                </label>
                                <label class="compact-field"
                                    >Уровень владения
                                    <NSelect
                                        class="select-control"
                                        :value="skill.proficiency"
                                        :options="proficiencyOptions"
                                        :disabled="disabled"
                                        @update:value="updateProficiency(skill.id, $event)"
                                    />
                                </label>
                                <label class="compact-field"
                                    >Как считать бонус
                                    <NSelect
                                        class="select-control"
                                        :value="getSkillCalculationMode(skill)"
                                        :options="calculationModeOptions"
                                        :disabled="disabled"
                                        @update:value="updateMode(skill.id, $event)"
                                    />
                                </label>
                                <NFormItem
                                    v-if="getSkillCalculationMode(skill) === 'manual'"
                                    label="Бонус вручную"
                                    ><NInputNumber
                                        :aria-label="`${skill.name}: бонус вручную`"
                                        :disabled="disabled"
                                        :value="skill.value"
                                        @update:value="updateValue(skill.id, $event)"
                                /></NFormItem>
                                <NFormItem v-else label="Дополнительная поправка"
                                    ><NInputNumber
                                        class="skill-additional-bonus-field"
                                        :disabled="disabled"
                                        :value="skill.additionalBonus"
                                        @update:value="updateAdditional(skill.id, $event)"
                                /></NFormItem>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
