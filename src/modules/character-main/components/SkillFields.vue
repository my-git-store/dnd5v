<script setup lang="ts">
import { computed } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '@/domain/skillBonus'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities, SkillProficiency } from '@/types/character'
import type { SkillProficiencySource } from '@/types/character'
import type { CharacterSkillPatch, CharacterSkillView } from '@/types/characterView'

type Emits = {
    update: [id: string, patch: CharacterSkillPatch]
}

const props = defineProps<{
    skills: CharacterSkillView[]
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
        <div class="c-section-heading">
            <h2>Навыки</h2>
        </div>
        <div class="skills-grid">
            <div v-for="(column, columnIndex) in skillColumns" :key="columnIndex" class="skills-column">
                <div v-for="skill in column" :key="skill.id" class="skill-row">
                    <div class="skill-row-summary">
                        <span class="skill-proficiency-dot" :class="{ active: skill.proficiency !== 'none' }"
                            aria-hidden="true"></span>
                        <strong class="skill-name">{{ skill.name }}</strong>
                        <span class="skill-ability-code" :title="skill.ability
                            ? abilityLabels[skill.ability]
                            : 'Характеристика не выбрана'
                            ">{{ skill.ability ? abilityShortLabels[skill.ability] : '—' }}</span>
                        <span class="skill-bonus-pill">{{ displayBonus(skill) }}</span>
                        <span class="skill-calculation-mode" :class="getSkillCalculationMode(skill) === 'manual' ? 'manual' : 'computed'
                            ">{{
                                getSkillCalculationMode(skill) === 'manual' ? 'Вручную' : 'Расчёт'
                            }}</span>
                    </div>
                    <NCollapse class="skill-settings" arrow-placement="right">
                        <NCollapseItem :name="skill.id">
                            <template #header="{ collapsed }">
                                <button type="button" class="skill-settings-toggle" :aria-expanded="!collapsed"
                                    :aria-label="`${skill.name}: настроить`">
                                    <span v-if="skillSources(skill).length" class="skill-source-inline">Источник:
                                        {{
                                            skillSources(skill)
                                                .map(source => sourceLabels[source])
                                                .join(' · ')
                                        }}</span>
                                    <span v-else class="skill-source-inline muted">Без источника владения</span>
                                    <span class="skill-settings-label">Настроить</span>
                                </button>
                            </template>
                            <div class="skill-controls">
                                <NFormItem label="Связанная характеристика" label-placement="top"
                                    :show-feedback="false">
                                    <NSelect size="small" :value="skill.ability ?? ''"
                                        :aria-label="`${skill.name}: связанная характеристика`"
                                        :options="abilityOptions" :disabled="disabled"
                                        @update:value="updateAbility(skill.id, $event)" />
                                </NFormItem>
                                <NFormItem label="Уровень владения" label-placement="top" :show-feedback="false">
                                    <NSelect size="small" :value="skill.proficiency"
                                        :aria-label="`${skill.name}: уровень владения`" :options="proficiencyOptions"
                                        :disabled="disabled" @update:value="updateProficiency(skill.id, $event)" />
                                </NFormItem>
                                <NFormItem label="Как считать бонус" label-placement="top" :show-feedback="false">
                                    <NSelect size="small" :value="getSkillCalculationMode(skill)"
                                        :aria-label="`${skill.name}: как считать бонус`"
                                        :options="calculationModeOptions" :disabled="disabled"
                                        @update:value="updateMode(skill.id, $event)" />
                                </NFormItem>
                                <NFormItem v-if="getSkillCalculationMode(skill) === 'manual'" label="Бонус вручную"
                                    label-placement="top" :show-feedback="false">
                                    <NInputNumber size="small" button-placement="both"
                                        :aria-label="`${skill.name}: бонус вручную`" :disabled="disabled"
                                        :value="skill.value" @update:value="updateValue(skill.id, $event)" />
                                </NFormItem>
                                <NFormItem v-else label="Дополнительная поправка" label-placement="top"
                                    :show-feedback="false">
                                    <NInputNumber size="small" button-placement="both"
                                        :aria-label="`${skill.name}: дополнительная поправка`" :disabled="disabled"
                                        :value="skill.additionalBonus"
                                        @update:value="updateAdditional(skill.id, $event)" />
                                </NFormItem>
                            </div>
                        </NCollapseItem>
                    </NCollapse>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
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

.skill-row {
    min-width: 0;
    container: skill-row / inline-size;
    padding: 11px 0 10px;
    border-top: 1px solid #dfcba7;
}

.skill-row:first-child {
    border-top: 0;
}

.skill-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding-top: 12px;
    border-top: 1px dashed var(--sheet-line-soft);
}

.skills-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
}

.skills-column {
    min-width: 0;
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
    border: 1px solid #c5a56d;
    border-radius: 8px;
    background: #fff1cf;
    color: var(--sheet-burgundy-dark);
    font-weight: 800;
}

.skill-settings {
    width: auto;
    min-width: 0;
    margin: 5px 0 0 24px;
}

.skill-settings-toggle {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    padding: 3px 0;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.skill-settings-label {
    color: var(--sheet-burgundy);
    font-size: 0.68rem;
    font-weight: 800;
    white-space: nowrap;
}

.skill-settings :deep(.n-collapse-item__header-main) {
    min-width: 0;
}

.skill-settings :deep(.n-collapse-item-arrow) {
    flex-shrink: 0;
    color: var(--sheet-burgundy);
}

.skill-settings :deep(.n-collapse-item__content-inner) {
    padding-top: 8px;
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

.skill-controls :deep(.n-form-item) {
    min-width: 0;
    grid-template-rows: 1fr auto;
}

.skill-controls :deep(.n-form-item-label) {
    min-height: 0;
    padding: 0 0 6px;
    color: var(--sheet-muted);
    font-size: 0.72rem;
    line-height: 1.3;
}

.skill-controls :deep(.n-form-item-blank) {
    min-width: 0;
    min-height: 0;
}

.skill-controls :deep(.n-input-number) {
    display: flex;
    width: 100%;
    min-width: 0;
}

@container skill-row (max-width: 400px) {
    .skill-controls {
        grid-template-columns: minmax(0, 1fr);
    }
}

</style>
