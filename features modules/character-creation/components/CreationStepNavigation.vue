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
    <nav aria-label="Шаги создания персонажа">
        <ol>
            <li v-for="(step, index) in steps" :key="step.id">
                <NButton
                    native-type="button"
                    :disabled="disabled || index + 1 > highestUnlockedStep"
                    :aria-current="currentStep === index + 1 ? 'step' : undefined"
                    :aria-label="`${index + 1}. ${stepLabel(index)}${index + 1 > highestUnlockedStep ? ', недоступен' : index + 1 < currentStep ? ', завершён' : ''}`"
                    @click="emit('selectStep', index + 1)"
                >
                    <span>{{ index + 1 < currentStep ? '✓' : index + 1 }}</span
                    ><span>{{ stepLabel(index) }}</span>
                </NButton>
            </li>
        </ol>
    </nav>
</template>
