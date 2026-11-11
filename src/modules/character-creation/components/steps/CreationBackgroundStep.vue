<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import type { AbilityKey } from '@/types/character'

import { hideBrokenAsset } from '../../utils/creationLabels'
import CreationEquipmentChoices from '../CreationEquipmentChoices.vue'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'backgroundOptions'
            | 'backgroundId'
            | 'skillLabels'
            | 'selectedModernBackground'
            | 'backgroundAbilityChoices'
            | 'originAbilityFocus'
            | 'selectedBackground'
            | 'backgroundEquipmentOptions'
            | 'backgroundEquipmentId'
        >
    >
    disabled?: boolean
}
type Emits = {
    selectBackground: [id: string]
    toggleBackgroundAbility: [key: AbilityKey]
    selectOriginAbilityFocus: [key: AbilityKey]
    selectBackgroundKit: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
    backgroundOptions,
    backgroundId,
    skillLabels,
    selectedModernBackground,
    backgroundAbilityChoices,
    originAbilityFocus,
    selectedBackground,
    backgroundEquipmentOptions,
    backgroundEquipmentId,
} = toRefs(props.model)
</script>

<template>
    <div class="creation-step-content">
        <div
            class="selection-grid background-selection-grid"
            role="group"
            aria-label="Выберите предысторию"
        >
            <button
                v-for="background in backgroundOptions"
                :key="background.id"
                type="button"
                class="selection-card"
                :class="{ selected: backgroundId === background.id }"
                :aria-pressed="backgroundId === background.id"
                :disabled="disabled"
                @click="emit('selectBackground', background.id)"
            >
                <span class="selection-card-top"
                    ><span class="background-icon" aria-hidden="true"
                        ><span
                            data-asset-fallback
                            class="background-icon-fallback"
                            :hidden="Boolean(background.icon)"
                            >{{ background.label.slice(0, 1) }}</span
                        ><img
                            v-if="background.icon"
                            :src="background.icon"
                            :alt="`Иконка предыстории «${background.label}»`"
                            loading="lazy"
                            @error="hideBrokenAsset" /></span
                    ><span
                        v-if="backgroundId === background.id"
                        class="selection-check"
                        aria-label="Выбрано"
                        >✓</span
                    ></span
                >
                <strong>{{ background.label }}</strong>
                <span class="selection-description">{{ background.description }}</span>
                <span class="selection-origin"
                    >Навыки:
                    {{
                        background.skillProficiencies
                            .map(id => skillLabels[id] ?? id)
                            .join(' · ') || 'не указаны'
                    }}</span
                >
                <span class="selection-origin"
                    >Инструменты:
                    {{ background.toolProficiencies.join(' · ') || 'не указаны' }}</span
                >
                <span class="selection-origin">{{
                    background.originFeatLabel
                        ? `Черта происхождения: ${background.originFeatLabel}`
                        : `Особенность: ${background.feature}`
                }}</span>
                <span v-if="background.languages.length" class="selection-origin"
                    >Языки: {{ background.languages.join(' · ') }}</span
                >
            </button>
        </div>
        <div class="origin-ability-choice">
            <div>
                <strong>Бонусы характеристик</strong
                ><small
                    >Выберите три характеристики. Одна выбранная характеристика получает +2, две
                    другие — +1.</small
                >
            </div>
            <div
                class="origin-ability-options"
                role="group"
                aria-label="Характеристики предыстории"
            >
                <button
                    v-for="key in selectedModernBackground?.abilityOptions ?? []"
                    :key="key"
                    type="button"
                    class="origin-ability-option"
                    :class="{
                        selected: backgroundAbilityChoices.includes(key),
                    }"
                    :aria-pressed="backgroundAbilityChoices.includes(key)"
                    :disabled="
                        disabled ||
                        (!backgroundAbilityChoices.includes(key) &&
                            backgroundAbilityChoices.length >= 3)
                    "
                    @click="emit('toggleBackgroundAbility', key)"
                >
                    {{ ABILITY_FIELDS.find(field => field.key === key)?.label ?? key }}
                </button>
            </div>
            <div class="origin-ability-focus">
                <span>Бонус +2:</span
                ><button
                    v-for="key in backgroundAbilityChoices"
                    :key="`focus-${key}`"
                    type="button"
                    class="origin-ability-option"
                    :class="{ selected: originAbilityFocus === key }"
                    :aria-pressed="originAbilityFocus === key"
                    :disabled="disabled"
                    @click="emit('selectOriginAbilityFocus', key)"
                >
                    {{ ABILITY_FIELDS.find(field => field.key === key)?.label ?? key }}
                </button>
            </div>
            <small v-if="selectedModernBackground?.originFeatId"
                >Черта происхождения: {{ selectedBackground.originFeatLabel
                }}<span v-if="selectedBackground.originFeatDescription">
                    — {{ selectedBackground.originFeatDescription }}</span
                ></small
            >
        </div>
        <div v-if="backgroundEquipmentOptions.length" class="equipment-choice-group">
            <div class="equipment-group-heading">
                <h3>Набор предыстории · {{ selectedBackground.label }}</h3>
                <p class="c-section-note">
                    Выберите один вариант — его предметы и деньги попадут в инвентарь при создании.
                </p>
            </div>
            <CreationEquipmentChoices
                :options="backgroundEquipmentOptions"
                :selected-id="backgroundEquipmentId"
                :disabled="disabled"
                @select="emit('selectBackgroundKit', $event)"
            />
        </div>
    </div>
</template>

<style scoped src="../styles/creation-selection.css"></style>
<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.origin-ability-choice {
    display: grid;
    gap: 10px;
    margin-top: 16px;
    padding: 13px 14px;
    border: 1px solid #d6bd91;
    border-radius: 11px;
    background: rgba(255, 248, 231, 0.72);
}
.origin-ability-choice > div:first-child {
    display: grid;
    gap: 3px;
}
.origin-ability-choice small {
    color: var(--sheet-muted);
    font-size: 0.78rem;
}
.origin-ability-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.origin-ability-option {
    min-height: 36px;
    padding: 7px 11px;
    border: 1px solid var(--sheet-line);
    border-radius: 8px;
    background: rgba(255, 252, 244, 0.92);
    color: var(--sheet-ink);
    cursor: pointer;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    transition:
        background-color 0.18s ease,
        border-color 0.18s ease,
        transform 0.18s ease;
}
.origin-ability-option:hover:not(:disabled) {
    border-color: var(--sheet-gold);
    transform: translateY(-1px);
}
.origin-ability-option.selected {
    border-color: var(--sheet-burgundy);
    background: #f2dfbd;
    box-shadow: 0 0 0 2px rgba(122, 62, 67, 0.12);
}
.origin-ability-option:disabled {
    cursor: default;
    opacity: 0.62;
}
.origin-ability-focus {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--sheet-muted);
    font-size: 0.78rem;
    font-weight: 700;
}
.background-icon {
    display: grid;
    place-items: center;
    position: relative;
    width: 128px;
    height: 128px;
    overflow: hidden;
    border: 1px solid #d5c19b;
    border-radius: 50%;
    background: #f8efd9;
    color: #75552e;
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 800;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
}
.background-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.selection-card:hover:not(:disabled) .background-icon {
    border-color: #b18a53;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 3px 8px rgba(78, 53, 26, 0.12);
    transform: scale(1.02);
}
.selection-card.selected .background-icon {
    border-color: var(--sheet-burgundy);
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 0 0 3px rgba(155, 106, 47, 0.13);
}
.background-selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
