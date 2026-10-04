<script setup lang="ts">
import { CInput } from '@/ui/components'
import { ABILITY_FIELDS } from '../data/characterFields'
import { calculateSkillBonus, getSkillCalculationMode } from '../domain/skillBonus'
import { signedModifier } from '../domain/abilityModifier'
import type { AbilityKey, CharacterAbilities, SkillProficiency } from '../types/character'
import type { SkillProficiencySource } from '../types/characterV3'
import type { CharacterSkillPatch, CharacterSkillView } from '../types/characterView'

const props = defineProps<{ skills: CharacterSkillView[]; abilities: CharacterAbilities; level: number; classSkillIds?: string[]; raceSkillIds?: string[]; backgroundSkillIds?: string[]; disabled?: boolean }>()
const emit = defineEmits<{ update: [id: string, patch: CharacterSkillPatch] }>()
const abilityLabels = Object.fromEntries(ABILITY_FIELDS.map((field) => [field.key, field.label])) as Record<AbilityKey, string>
const proficiencyOptions: Array<{ value: SkillProficiency; label: string }> = [
  { value: 'none', label: 'Без владения' }, { value: 'proficient', label: 'Владение (+бонус)' }, { value: 'expertise', label: 'Экспертиза (×2)' },
]
const sourceLabels: Record<SkillProficiencySource, string> = { race: 'Вид', class: 'Класс', background: 'Предыстория', feat: 'Черта', manual: 'Вручную' }
const abilityShortLabels: Record<AbilityKey, string> = { strength: 'СИЛ', dexterity: 'ЛОВ', constitution: 'ТЕЛ', intelligence: 'ИНТ', wisdom: 'МДР', charisma: 'ХАР' }

function updateValue(id: string, value: unknown) {
  const parsed = Number(value)
  emit('update', id, { value: Number.isFinite(parsed) ? parsed : 0 })
}
function updateAdditional(id: string, value: unknown) {
  const parsed = Number(value)
  emit('update', id, { additionalBonus: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
}
function updateAbility(id: string, value: string) { emit('update', id, { ability: value ? value as AbilityKey : null }) }
function updateProficiency(id: string, value: string) { emit('update', id, { proficiency: value as SkillProficiency }) }
function updateMode(id: string, value: string) { emit('update', id, { calculationMode: value === 'computed' ? 'computed' : 'manual' }) }
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
        <p class="section-note">Связь навыка с характеристикой обычно задана правилами. Владение добавляется источниками, а бонус можно ввести вручную или считать автоматически.</p>
      </div>
    </div>
    <div class="skills-grid">
      <div v-for="skill in skills" :key="skill.id" class="skill-row">
        <div class="skill-row-summary">
          <span class="skill-proficiency-dot" :class="{ active: skill.proficiency !== 'none' }" aria-hidden="true"></span>
          <strong class="skill-name">{{ skill.name }}</strong>
          <span class="skill-ability-code" :title="skill.ability ? abilityLabels[skill.ability] : 'Характеристика не выбрана'">{{ skill.ability ? abilityShortLabels[skill.ability] : '—' }}</span>
          <span class="skill-bonus-pill">{{ displayBonus(skill) }}</span>
        </div>
        <div class="skill-row-meta">
          <span v-if="skillSources(skill).length" class="skill-source-inline">Источник: {{ skillSources(skill).map((source) => sourceLabels[source]).join(' · ') }}</span>
          <span v-else class="skill-source-inline muted">Без источника владения</span>
          <details class="skill-settings">
            <summary>Настроить</summary>
            <div class="skill-controls">
              <label class="compact-field">Связанная характеристика
                <select class="select-control" :value="skill.ability ?? ''" :disabled="disabled" @change="updateAbility(skill.id, ($event.target as HTMLSelectElement).value)">
                  <option value="">Не выбрана</option>
                  <option v-for="field in ABILITY_FIELDS" :key="field.key" :value="field.key">{{ field.label }}</option>
                </select>
              </label>
              <label class="compact-field">Уровень владения
                <select class="select-control" :value="skill.proficiency" :disabled="disabled" @change="updateProficiency(skill.id, ($event.target as HTMLSelectElement).value)">
                  <option v-for="option in proficiencyOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label class="compact-field">Как считать бонус
                <select class="select-control" :value="getSkillCalculationMode(skill)" :disabled="disabled" @change="updateMode(skill.id, ($event.target as HTMLSelectElement).value)">
                  <option value="computed">По характеристике</option>
                  <option value="manual">Вручную</option>
                </select>
              </label>
              <CInput v-if="getSkillCalculationMode(skill) === 'manual'" type="number" :aria-label="`${skill.name}: бонус вручную`" label="Бонус вручную" :disabled="disabled" :model-value="skill.value" @update:model-value="updateValue(skill.id, $event)" />
              <CInput v-else type="number" label="Дополнительная поправка" :disabled="disabled" :model-value="skill.additionalBonus" @update:model-value="updateAdditional(skill.id, $event)" />
            </div>
          </details>
        </div>
      </div>
    </div>
  </section>
</template>
