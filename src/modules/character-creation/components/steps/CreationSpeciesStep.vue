<script setup lang="ts">
import { toRefs } from 'vue'

import { speciesIconFor } from '@/data/speciesIcons'

import { hideBrokenAsset, choiceOptions, raceBonusLines } from '../../utils/creationLabels'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'ruleset'
            | 'raceOptions'
            | 'raceId'
            | 'selected2024Species'
            | 'skillLabels'
            | 'speciesChoices'
        >
    >
    disabled?: boolean
}
type Emits = {
    selectRace: [id: string]
    selectSpeciesChoice: [choiceId: string, choice: string | null]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { ruleset, raceOptions, raceId, selected2024Species, skillLabels, speciesChoices } = toRefs(
    props.model,
)
</script>

<template>
    <div class="creation-step-content">
        <p v-if="ruleset === '2024'" class="creation-source-explainer creation-race-bonus-note">
            Бонусы характеристик задаются исходными значениями.
        </p>
        <div
            class="selection-grid race-selection-grid"
            role="group"
            :aria-label="ruleset === '2024' ? 'Выберите вид' : 'Выберите расу'"
        >
            <button
                v-for="race in raceOptions"
                :key="race.id"
                type="button"
                class="selection-card"
                :class="{ selected: raceId === race.id }"
                :aria-pressed="raceId === race.id"
                :disabled="disabled"
                @click="emit('selectRace', race.id)"
            >
                <span class="selection-card-top"
                    ><span v-if="ruleset === '2024'" class="species-icon" aria-hidden="true"
                        ><span
                            data-asset-fallback
                            class="species-icon-fallback"
                            :hidden="Boolean(speciesIconFor(race.id))"
                            >{{ race.label.slice(0, 1) }}</span
                        ><img
                            v-if="speciesIconFor(race.id)"
                            :src="speciesIconFor(race.id)"
                            :alt="`Иконка вида «${race.label}»`"
                            loading="lazy"
                            @error="hideBrokenAsset" /></span
                    ><span v-else class="selection-sigil" aria-hidden="true">{{
                        race.label.slice(0, 1)
                    }}</span
                    ><span v-if="raceId === race.id" class="selection-check" aria-label="Выбрано"
                        >✓</span
                    ></span
                >
                <strong>{{ race.label }}</strong
                ><span class="selection-description"
                    >{{ race.profile.size }} · скорость {{ race.profile.speed }} фт.</span
                ><span
                    v-if="ruleset === '2024' && race.id === selected2024Species.id"
                    class="selection-description"
                    >{{ selected2024Species.description }}</span
                >
                <span v-if="ruleset !== '2024'" class="selection-bonuses"
                    ><span v-for="bonus in raceBonusLines(ruleset, race.id)" :key="bonus">{{
                        bonus
                    }}</span></span
                >
                <span class="selection-traits"
                    >Особенности: {{ race.profile.traits.join(' · ') }}</span
                >
                <span
                    v-if="ruleset === '2024' && race.id === selected2024Species.id"
                    class="selection-origin"
                    >Языки: {{ selected2024Species.languages.join(', ') || 'не указаны' }}</span
                >
                <span v-if="race.skillProficiencies?.length" class="selection-origin"
                    >Владение:
                    {{ race.skillProficiencies.map(id => skillLabels[id] ?? id).join(', ') }}</span
                >
            </button>
        </div>
        <div
            v-if="ruleset === '2024' && selected2024Species.choices.length"
            class="species-choice-panel"
        >
            <div class="creation-panel-heading">
                <div>
                    <p class="c-eyebrow">Наследие вида</p>
                    <h3>Выберите особенность</h3>
                    <p class="c-section-note">
                        Выбор сохраняется как источник «Вид»; правила будут подключены отдельным
                        слоем правил.
                    </p>
                </div>
                <span class="creation-rune" aria-hidden="true">✧</span>
            </div>
            <div
                v-for="choice in selected2024Species.choices"
                :key="choice.id"
                class="species-choice-row"
            >
                <div>
                    <strong>{{ choice.label }}</strong>
                    <p class="c-section-note">{{ choice.description }}</p>
                </div>
                <label class="c-compact-field"
                    ><span class="sr-only">{{ choice.label }}</span
                    ><NSelect
                        class="c-select-control"
                        :value="speciesChoices[choice.id]?.[0] ?? ''"
                        :options="choiceOptions(choice.options)"
                        :disabled="disabled"
                        @update:value="emit('selectSpeciesChoice', choice.id, $event)"
                /></label>
            </div>
        </div>
    </div>
</template>

<style scoped src="../styles/creation-selection.css"></style>
<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.species-icon {
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
.species-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.selection-card:hover:not(:disabled) .species-icon {
    border-color: #b18a53;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 3px 8px rgba(78, 53, 26, 0.12);
    transform: scale(1.02);
}
.selection-card.selected .species-icon {
    border-color: var(--sheet-burgundy);
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 0 0 3px rgba(155, 106, 47, 0.13);
}
.species-choice-panel {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--sheet-line, #d5ba8a);
    border-radius: 0.75rem;
    background: rgba(255, 250, 238, 0.72);
}
.species-choice-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(13rem, 18rem);
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 0;
    border-top: 1px solid rgba(151, 111, 57, 0.24);
}
.species-choice-row:first-of-type {
    border-top: 0;
}
</style>
