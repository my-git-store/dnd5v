<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'

import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'classSkillsRemaining'
            | 'selectedCount'
            | 'selectedClass'
            | 'selectableSkills'
            | 'isSkillChoiceSelected'
            | 'canSelectSkill'
            | 'currentOwnedSkills'
            | 'finalAbility'
            | 'selectableSkillSource'
        >
    >
    disabled?: boolean
}
type Emits = {
    toggleSkill: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
    classSkillsRemaining,
    selectedCount,
    selectedClass,
    selectableSkills,
    isSkillChoiceSelected,
    canSelectSkill,
    currentOwnedSkills,
    finalAbility,
    selectableSkillSource,
} = toRefs(props.model)
</script>

<template>
    <div class="creation-step-content">
        <div class="skill-step-summary">
            <span :class="{ 'selection-complete': classSkillsRemaining === 0 }"
                >Выбор навыков: <b>{{ selectedCount }} / {{ selectedClass.skillChoiceCount }}</b
                ><small>{{
                    classSkillsRemaining
                        ? `Осталось выбрать: ${classSkillsRemaining}`
                        : 'Выбор завершён'
                }}</small></span
            >
        </div>
        <div class="creation-skills-list">
            <button
                v-for="skill in selectableSkills"
                :key="skill.id"
                type="button"
                class="creation-skill-row creation-skill-choice"
                :class="{ selected: isSkillChoiceSelected(skill.id) }"
                :aria-pressed="isSkillChoiceSelected(skill.id)"
                :disabled="
                    disabled || (!isSkillChoiceSelected(skill.id) && !canSelectSkill(skill.id))
                "
                @click="emit('toggleSkill', skill.id)"
            >
                <span class="creation-skill-name"
                    ><strong>{{ skill.name }}</strong
                    ><span
                        >{{
                            ABILITY_FIELDS.find(field => field.key === skill.ability)?.label ??
                            'Характеристика не задана'
                        }}
                        · итог
                        {{
                            currentOwnedSkills.find(entry => entry.id === skill.id)?.bonus ??
                            signedModifier(
                                abilityModifier(skill.ability ? finalAbility(skill.ability) : 10),
                            )
                        }}</span
                    ></span
                ><span class="creation-skill-choice-source">{{
                    selectableSkillSource(skill.id)
                }}</span
                ><span
                    class="creation-skill-selection-check"
                    :class="{ visible: isSkillChoiceSelected(skill.id) }"
                    :aria-label="isSkillChoiceSelected(skill.id) ? 'Выбрано' : undefined"
                    >{{ isSkillChoiceSelected(skill.id) ? '✓' : '' }}</span
                >
            </button>
        </div>
        <p class="creation-source-explainer">
            Выберите ровно указанное количество навыков класса и вида. После достижения лимита
            остальные варианты блокируются. Владения складываются по источникам: один навык может
            одновременно происходить от вида, класса и ручной настройки.
        </p>
    </div>
</template>

<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.skill-step-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
}
.skill-step-summary span {
    padding: 6px 9px;
    border: 1px solid #ddceb1;
    border-radius: 999px;
    background: #fbf4e5;
    color: #796449;
    font-size: 0.72rem;
}
.skill-step-summary small {
    display: inline-block;
    margin-left: 5px;
}
.skill-step-summary b {
    color: #573d24;
}
.creation-skills-list {
    display: grid;
    gap: 6px;
}
.creation-skill-row {
    display: grid;
    grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 0.9fr) minmax(110px, 0.8fr);
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border: 1px solid transparent;
    border-bottom-color: #eadcc3;
    border-radius: 8px;
    transition:
        background 0.16s ease,
        border-color 0.16s ease;
}
.creation-skill-name {
    display: grid;
    gap: 3px;
    min-width: 0;
}
.creation-skill-name strong {
    color: #493522;
    font-size: 0.82rem;
}
.creation-skill-name > span {
    color: #88755c;
    font-size: 0.67rem;
}
.creation-skill-choice {
    grid-template-columns: minmax(0, 1fr) auto 38px;
    width: 100%;
    min-height: 62px;
    color: inherit;
    text-align: left;
    font: inherit;
    background: transparent;
    cursor: pointer;
}
.creation-skill-choice:hover:not(:disabled) {
    border-color: #d0b788;
    background: rgba(255, 249, 236, 0.72);
}
.creation-skill-choice.selected {
    border-color: #b9c49f;
    background: #edf1e5;
}
.creation-skill-choice:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.creation-skill-choice-source {
    color: #806c53;
    font-size: 0.68rem;
    font-weight: 700;
    white-space: nowrap;
}
.creation-skill-selection-check {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 2px solid #c7b79d;
    border-radius: 50%;
    color: transparent;
    font-size: 1.35rem;
    font-weight: 900;
    line-height: 1;
}
.creation-skill-selection-check.visible {
    border-color: #54705b;
    background: #54705b;
    color: #fffdf5;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.22);
}
</style>
