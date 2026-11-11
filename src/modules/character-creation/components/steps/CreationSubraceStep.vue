<script setup lang="ts">
import { toRefs } from 'vue'

import { subraceBonusLines } from '../../utils/creationLabels'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            'availableSubraces' | 'subraceId' | 'ruleset' | 'selectedRace' | 'raceId'
        >
    >
    disabled?: boolean
}
type Emits = {
    selectSubrace: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { availableSubraces, subraceId, ruleset, selectedRace, raceId } = toRefs(props.model)
</script>

<template>
    <div class="creation-step-content">
        <div
            v-if="availableSubraces.length"
            class="selection-grid subrace-selection-grid"
            role="group"
            aria-label="Выберите подрасу"
        >
            <button
                v-for="subrace in availableSubraces"
                :key="subrace.id"
                type="button"
                class="selection-card selection-card-wide"
                :class="{ selected: subraceId === subrace.id }"
                :aria-pressed="subraceId === subrace.id"
                :disabled="disabled"
                @click="emit('selectSubrace', subrace.id)"
            >
                <span class="selection-card-top"
                    ><span class="selection-sigil" aria-hidden="true">✧</span
                    ><span
                        v-if="subraceId === subrace.id"
                        class="selection-check"
                        aria-label="Выбрано"
                        >✓</span
                    ></span
                ><strong>{{ subrace.label }}</strong
                ><span class="selection-description">{{ subrace.description }}</span
                ><span class="selection-bonuses"
                    ><span v-for="bonus in subraceBonusLines(raceId, subrace.id)" :key="bonus">{{
                        bonus
                    }}</span></span
                ><span class="selection-traits">{{ subrace.traits.join(' · ') }}</span
                ><span v-if="subrace.languages?.length" class="selection-origin"
                    >Языки: {{ subrace.languages.join(', ') }}</span
                >
            </button>
        </div>
        <div v-else class="creation-callout">
            <span aria-hidden="true">✧</span>
            <p v-if="ruleset === '2024'">
                В D&amp;D 2024 дополнительные варианты вида выбираются на предыдущем шаге. Можно
                перейти дальше.
            </p>
            <p v-else>
                Для расы «{{ selectedRace.label }}» отдельные подрасы в текущем наборе правил не
                заданы. Можно перейти дальше.
            </p>
        </div>
    </div>
</template>

<style scoped src="../styles/creation-selection.css"></style>
<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.selection-card-wide {
    min-height: 175px;
}
.subrace-selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
