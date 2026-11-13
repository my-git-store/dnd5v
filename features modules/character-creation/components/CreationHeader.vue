<script setup lang="ts">
import { toRefs } from 'vue'
import { NProgress } from 'naive-ui'

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
</script>

<template>
    <header class="grid gap-3">
        <div>
            <p>Хроники начинаются здесь</p>
            <h1>Создание персонажа</h1>
            <p>{{ stepDescription(currentStep - 1) }}</p>
        </div>
        <div class="grid gap-3">
            <strong>Шаг {{ currentStep }} из {{ steps.length }}</strong><span>{{ stepLabel(currentStep - 1) }}</span>
        </div>
        <NProgress type="line" :percentage="stepProgress" :show-indicator="false"
            :aria-label="`Шаг ${currentStep} из ${steps.length}`" />
    </header>
</template>
