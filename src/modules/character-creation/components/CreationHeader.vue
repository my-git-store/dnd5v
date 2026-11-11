<script setup lang="ts">
import { computed, toRefs } from 'vue'
import type { CSSProperties } from 'vue'

import type { CharacterCreationModel } from '../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            'currentStep' | 'steps' | 'stepDescription' | 'stepLabel' | 'stepProgress'
        >
    >
}

const props = defineProps<Props>()

const { currentStep, steps, stepDescription, stepLabel, stepProgress } = toRefs(props.model)

const progressStyle = computed<CSSProperties>(() => ({ width: `${stepProgress.value}%` }))
</script>

<template>
    <header class="creation-hero c-sheet-section">
        <div class="creation-hero-mark" aria-hidden="true">✦</div>
        <div class="creation-hero-copy">
            <p class="c-eyebrow">Хроники начинаются здесь</p>
            <h1>Создание персонажа</h1>
            <p class="c-section-note">{{ stepDescription(currentStep - 1) }}</p>
        </div>
        <div class="creation-progress-copy">
            <strong>Шаг {{ currentStep }} из {{ steps.length }}</strong
            ><span>{{ stepLabel(currentStep - 1) }}</span>
        </div>
        <div
            class="creation-progress-track"
            role="progressbar"
            :aria-valuenow="currentStep"
            :aria-valuemin="1"
            :aria-valuemax="steps.length"
            :aria-label="`Шаг ${currentStep} из ${steps.length}`"
        >
            <span :style="progressStyle"></span>
        </div>
    </header>
</template>

<style scoped>
.creation-hero {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto;
    align-items: center;
    gap: 18px;
    margin-top: 22px;
    overflow: hidden;
    position: relative;
    background:
        radial-gradient(ellipse at 10% 0%, rgba(205, 165, 98, 0.2), transparent 54%),
        linear-gradient(135deg, rgba(255, 250, 237, 0.98), rgba(240, 221, 187, 0.88));
    border-color: #cdb58e;
}
.creation-hero::after {
    content: '';
    position: absolute;
    right: -22px;
    top: -74px;
    width: 210px;
    height: 210px;
    border: 1px solid rgba(145, 104, 53, 0.2);
    border-radius: 50%;
    box-shadow:
        0 0 0 12px rgba(145, 104, 53, 0.035),
        0 0 0 26px rgba(145, 104, 53, 0.025);
    pointer-events: none;
}
.creation-hero-mark {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    border: 1px solid #b99967;
    border-radius: 50%;
    box-shadow:
        inset 0 0 0 5px rgba(184, 147, 87, 0.12),
        0 4px 12px rgba(80, 52, 25, 0.09);
    color: #8b622c;
    font-size: 2rem;
}
.creation-hero-copy {
    min-width: 0;
}
.creation-hero-copy h1 {
    margin: 0;
    color: #442e1d;
    font-family: var(--font-serif);
    font-size: clamp(1.45rem, 2.2vw, 2rem);
    line-height: 1.15;
}
.creation-hero-copy .c-section-note {
    max-width: 610px;
    font-size: 0.9rem;
}
.creation-progress-copy {
    display: grid;
    justify-items: end;
    gap: 3px;
    min-width: 106px;
    color: #67451f;
}
.creation-progress-copy strong {
    font-size: 0.82rem;
}
.creation-progress-copy span {
    color: #977344;
    font-size: 0.78rem;
}
.creation-progress-track {
    bottom: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: rgba(132, 95, 47, 0.13);
}
.creation-progress-track span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #8f6635, #c29248, #7a3d3e);
    transition: width 0.35s ease;
}
.creation-hero {
    border-radius: 10px;
    border-color: #c4a474;
    box-shadow:
        0 7px 18px rgba(83, 59, 38, 0.08),
        inset 0 1px rgba(255, 255, 255, 0.7);
}
.creation-hero {
    background:
        radial-gradient(ellipse at 10% 0%, rgba(205, 165, 98, 0.23), transparent 54%),
        linear-gradient(135deg, rgba(255, 250, 237, 0.96), rgba(240, 221, 187, 0.82));
}
</style>
