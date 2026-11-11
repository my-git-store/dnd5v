<script setup lang="ts">
import { toRefs } from 'vue'

import type { CharacterCreationModel } from '../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<CharacterCreationModel, 'currentStep' | 'steps' | 'highestUnlockedStep' | 'stepLabel'>
    >
    disabled?: boolean
}
type Emits = {
    selectStep: [step: number]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { currentStep, steps, highestUnlockedStep, stepLabel } = toRefs(props.model)
</script>

<template>
    <nav class="creation-step-nav" aria-label="Шаги создания персонажа">
        <ol>
            <li
                v-for="(step, index) in steps"
                :key="step.id"
                :class="{
                    active: currentStep === index + 1,
                    done: index + 1 < currentStep,
                    locked: index + 1 > highestUnlockedStep,
                }"
            >
                <button
                    type="button"
                    :disabled="disabled || index + 1 > highestUnlockedStep"
                    :aria-current="currentStep === index + 1 ? 'step' : undefined"
                    :aria-label="`${index + 1}. ${stepLabel(index)}${index + 1 > highestUnlockedStep ? ', недоступен' : index + 1 < currentStep ? ', завершён' : ''}`"
                    @click="emit('selectStep', index + 1)"
                >
                    <span class="step-number">{{ index + 1 < currentStep ? '✓' : index + 1 }}</span
                    ><span class="step-label">{{ stepLabel(index) }}</span>
                </button>
            </li>
        </ol>
    </nav>
</template>

<style scoped>
.creation-step-nav {
    margin: 12px 0 18px;
    padding: 12px 14px;
    border: 1px solid rgba(169, 137, 93, 0.48);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(255, 250, 239, 0.96), rgba(246, 234, 211, 0.91));
    box-shadow:
        inset 0 1px rgba(255, 255, 255, 0.8),
        0 5px 15px rgba(78, 54, 30, 0.05);
    overflow-x: auto;
}
.creation-step-nav ol {
    display: grid;
    grid-template-columns: repeat(9, minmax(88px, 1fr));
    gap: 4px;
    min-width: 800px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.creation-step-nav li {
    min-width: 0;
    position: relative;
}
.creation-step-nav li:not(:last-child)::after {
    content: '';
    position: absolute;
    z-index: 0;
    top: 16px;
    right: -4px;
    width: 9px;
    height: 1px;
    background: #d1bd9c;
}
.creation-step-nav button {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    width: 100%;
    min-height: 62px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    color: #816d55;
    cursor: pointer;
}
.creation-step-nav button:disabled {
    color: #b9ad9a;
    cursor: not-allowed;
}
.creation-step-nav .step-number {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    border: 1px solid #c9b48d;
    border-radius: 50%;
    background: #fff9ed;
    color: #72532e;
    font-size: 0.78rem;
    font-weight: 800;
    transition: all 0.2s ease;
}
.creation-step-nav .step-label {
    display: block;
    max-width: 100%;
    min-height: 2.3em;
    color: inherit;
    font-size: 0.69rem;
    font-weight: 700;
    line-height: 1.15;
    overflow-wrap: anywhere;
    text-align: center;
    white-space: normal;
}
.creation-step-nav li.active .step-number {
    width: 35px;
    height: 35px;
    margin-top: -2px;
    border-color: #794046;
    background: #793f45;
    box-shadow: 0 0 0 4px rgba(121, 63, 69, 0.12);
    color: #fff8e9;
}
.creation-step-nav li.active .step-label {
    color: #63383b;
}
.creation-step-nav li.done .step-number {
    border-color: #718355;
    background: #718355;
    color: #fffdf5;
}
.creation-step-nav li.done .step-label {
    color: #5f6e45;
}
.creation-step-nav li.locked .step-number {
    border-style: dashed;
    background: #f3ead9;
}
.creation-step-nav button:focus-visible {
    outline: 3px solid rgba(127, 60, 67, 0.44);
    outline-offset: 2px;
}
.creation-step-nav {
    border-color: #c4a474;
    background: rgba(255, 247, 228, 0.78);
    box-shadow: 0 3px 9px rgba(83, 59, 38, 0.05);
}
.creation-step-nav .step-number {
    border-color: #c4a474;
}
.creation-step-nav li.active .step-number {
    border-color: var(--sheet-burgundy);
    background: var(--sheet-burgundy);
}
</style>
