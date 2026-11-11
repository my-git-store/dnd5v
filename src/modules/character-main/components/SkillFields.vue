<script setup lang="ts">
import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '@/domain/skillBonus'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities, SkillProficiency } from '@/types/character'
import type { SkillProficiencySource } from '@/types/character'
import type { CharacterSkillPatch, CharacterSkillView } from '@/types/characterView'

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
    <section class="c-sheet-section skills-panel">
        <div class="c-section-heading c-section-heading-stack">
            <div>
                <h2>Навыки</h2>
                <p class="c-section-note">
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
                                <label class="c-compact-field"
                                    >Связанная характеристика
                                    <NSelect
                                        class="c-select-control"
                                        :value="skill.ability ?? ''"
                                        :options="abilityOptions"
                                        :disabled="disabled"
                                        @update:value="updateAbility(skill.id, $event)"
                                    />
                                </label>
                                <label class="c-compact-field"
                                    >Уровень владения
                                    <NSelect
                                        class="c-select-control"
                                        :value="skill.proficiency"
                                        :options="proficiencyOptions"
                                        :disabled="disabled"
                                        @update:value="updateProficiency(skill.id, $event)"
                                    />
                                </label>
                                <label class="c-compact-field"
                                    >Как считать бонус
                                    <NSelect
                                        class="c-select-control"
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

<style scoped>
.skill-row {
    min-width: 0;
}
.skill-additional-bonus-field :deep(label) {
    color: var(--sheet-muted);
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.2;
}
.skill-calculation-mode {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    box-sizing: border-box;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    white-space: nowrap;
}
.skill-calculation-mode.computed {
    color: #49633d;
    background: #e9f0df;
}
.skill-calculation-mode.manual {
    color: #7a4a36;
    background: #f5e5d4;
}
.skills-grid {
    display: grid;
    gap: 10px;
}
.skill-row {
    display: grid;
    grid-template-columns: minmax(120px, 0.8fr) minmax(180px, 1.2fr);
    align-items: start;
    gap: 14px;
    padding: 11px 0;
    border-top: 1px solid var(--sheet-line-soft);
}
.skill-row:first-child {
    border-top: 0;
}
.skill-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}
@media (max-width: 560px) {
    .skill-row {
        grid-template-columns: minmax(0, 1fr);
    }
    .skill-controls {
        grid-template-columns: minmax(0, 1fr);
    }
}
.skills-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
}
.skills-column {
    min-width: 0;
}
.skills-panel .c-section-note {
    max-width: 34rem;
}
.skill-row {
    display: block;
    padding: 11px 0 10px;
}
.skill-row-summary {
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) 38px 46px 64px;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
.skill-proficiency-dot {
    display: block;
    width: 12px;
    height: 12px;
    border: 2px solid #b9ad98;
    border-radius: 50%;
    background: transparent;
    box-sizing: border-box;
}
.skill-proficiency-dot.active {
    border-color: #54705b;
    background: #54705b;
    box-shadow: inset 0 0 0 3px #f8efdc;
}
.skill-name {
    min-width: 0;
    color: var(--sheet-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.skill-ability-code {
    color: var(--sheet-muted);
    font-size: 0.68rem;
    font-weight: 800;
    text-align: center;
}
.skill-bonus-pill {
    display: inline-grid;
    place-items: center;
    min-width: 38px;
    min-height: 28px;
    padding: 0 7px;
    border: 1px solid #d6bd91;
    border-radius: 8px;
    background: #fff5de;
    color: #704b25;
    font-weight: 800;
}
.skill-row-meta {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px 12px;
    margin: 5px 0 0 24px;
    min-width: 0;
}
.skill-source-inline {
    min-width: 0;
    color: #806c53;
    font-size: 0.68rem;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.skill-source-inline.muted {
    color: #a08e76;
}
.skill-controls {
    gap: 9px;
}
.skill-controls .c-compact-field {
    min-width: 0;
}
.skill-settings {
    display: contents;
    min-width: 0;
}
.skill-settings summary {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
    padding: 3px 0;
    color: #805921;
    cursor: pointer;
    font-size: 0.68rem;
    font-weight: 800;
    list-style: none;
    white-space: nowrap;
}
.skill-settings summary::before {
    content: '▸';
    display: inline-block;
    margin-right: 5px;
    transition: transform 0.18s ease;
}
.skill-settings[open] summary::before {
    transform: rotate(90deg);
}
.skill-settings .skill-controls {
    display: none;
}
.skill-settings[open] .skill-controls {
    display: grid;
    grid-column: 1 / -1;
    grid-row: 2;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--sheet-line-soft);
}
@media (max-width: 800px) {
    .skills-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .skill-settings[open] .skill-controls {
        grid-template-columns: minmax(0, 1fr);
    }
}
@media (max-width: 560px) {
    .skills-grid {
        grid-template-columns: minmax(0, 1fr);
    }
    .skill-row-meta {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 5px 8px;
    }
    .skill-settings {
        width: auto;
    }
    .skill-settings[open] .skill-controls {
        grid-template-columns: minmax(0, 1fr);
    }
}
.skills-panel .skill-row {
    border-color: #dfcba7;
}
.skill-bonus-pill {
    border-color: #c5a56d;
    background: #fff1cf;
    color: var(--sheet-burgundy-dark);
}
.skill-settings summary {
    color: var(--sheet-burgundy);
}
.skill-proficiency-dot.active {
    border-color: #54705b;
    background: #54705b;
}
</style>
