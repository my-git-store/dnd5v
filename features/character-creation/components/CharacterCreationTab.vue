<script setup lang="ts">
import { reactive, toRefs } from 'vue'

import type { CharacterCreationPayload } from '../domain/characterCreation'
import type { CharacterSheetView } from '@/types/characterView'

import { useCharacterCreation } from '../composables/useCharacterCreation'
import CreationHeader from './CreationHeader.vue'
import CreationStepNavigation from './CreationStepNavigation.vue'
import CreationPreview from './CreationPreview.vue'
import CreationIdentityStep from './steps/CreationIdentityStep.vue'
import CreationSpeciesStep from './steps/CreationSpeciesStep.vue'
import CreationBackgroundStep from './steps/CreationBackgroundStep.vue'
import CreationSpeciesDetailsStep from './steps/CreationSpeciesDetailsStep.vue'
import CreationClassStep from './steps/CreationClassStep.vue'
import CreationAbilitiesStep from './steps/CreationAbilitiesStep.vue'
import CreationSkillsStep from './steps/CreationSkillsStep.vue'
import CreationEquipmentStep from './steps/CreationEquipmentStep.vue'
import CreationReviewStep from './steps/CreationReviewStep.vue'

type Props = {
    character: CharacterSheetView
    disabled?: boolean
    hidePreview?: boolean
    creationError?: string | null
}
type Emits = { create: [payload: CharacterCreationPayload]; 'back-to-sheet': [] }
const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const creation = reactive(
    useCharacterCreation(
        () => props.character,
        payload => emit('create', payload),
    ),
)

const { currentStep, isCompleted, stepIssue, stepLabel, stepDescription, steps, canContinue } =
    toRefs(creation)
</script>

<template>
    <div class="grid gap-4">
        <CreationHeader :model="creation" />
        <CreationStepNavigation
            :model="creation"
            :disabled="disabled"
            @select-step="creation.goToStep"
        />

        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <div class="lg:col-span-2">
                <Transition :css="false" mode="out-in">
                    <section
                        :key="currentStep"
                        :aria-labelledby="`creation-step-title-${currentStep}`"
                    >
                        <div class="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p>Этап {{ String(currentStep).padStart(2, '0') }}</p>
                                <h2 :id="`creation-step-title-${currentStep}`">
                                    {{ stepLabel(currentStep - 1) }}
                                </h2>
                                <p>{{ stepDescription(currentStep - 1) }}</p>
                            </div>
                            <span aria-hidden="true">{{ currentStep === 9 ? '✧' : '✦' }}</span>
                        </div>

                        <div v-if="stepIssue || props.creationError" role="alert">
                            {{ props.creationError || stepIssue }}
                        </div>

                        <CreationIdentityStep
                            v-if="currentStep === 1"
                            :model="creation"
                            :disabled="disabled"
                            @update-name="creation.updateName"
                            @update-gender="creation.updateGender"
                            @update-alignment="creation.updateAlignment"
                            @update-subclass="creation.updateSubclass"
                        />
                        <CreationSpeciesStep
                            v-else-if="currentStep === 2"
                            :model="creation"
                            :disabled="disabled"
                            @select-race="creation.updateRace"
                            @select-species-choice="creation.selectSpeciesChoice"
                        />
                        <CreationBackgroundStep
                            v-else-if="currentStep === 3"
                            :model="creation"
                            :disabled="disabled"
                            @select-background="creation.updateBackground"
                            @toggle-background-ability="creation.toggleBackgroundAbility"
                            @select-origin-ability-focus="creation.selectOriginAbilityFocus"
                            @select-background-kit="creation.selectBackgroundKit"
                        />
                        <CreationSpeciesDetailsStep
                            v-else-if="currentStep === 4"
                            :model="creation"
                        />
                        <CreationClassStep
                            v-else-if="currentStep === 5"
                            :model="creation"
                            :disabled="disabled"
                            @select-class="creation.updateClass"
                        />
                        <CreationAbilitiesStep
                            v-else-if="currentStep === 6"
                            :model="creation"
                            :disabled="disabled"
                            @update-ability="creation.updateAbility"
                        />
                        <CreationSkillsStep
                            v-else-if="currentStep === 7"
                            :model="creation"
                            :disabled="disabled"
                            @toggle-skill="creation.toggleSelectableSkill"
                        />
                        <CreationEquipmentStep
                            v-else-if="currentStep === 8"
                            :model="creation"
                            :disabled="disabled"
                            @select-class-kit="creation.selectClassKit"
                        />
                        <CreationReviewStep
                            v-else
                            :model="creation"
                            @back-to-sheet="emit('back-to-sheet')"
                            @edit="creation.editCreation"
                        />
                        <footer
                            v-if="!isCompleted"
                            class="mt-4 flex flex-wrap items-center justify-between gap-3"
                        >
                            <NButton
                                :disabled="disabled || currentStep === 1"
                                @click="creation.previousStep"
                                >Назад</NButton
                            ><span>{{ currentStep }} / {{ steps.length }}</span
                            ><NButton
                                v-if="currentStep < steps.length"
                                type="default"
                                :disabled="disabled || !canContinue"
                                @click="creation.nextStep"
                                >Далее</NButton
                            ><NButton
                                v-else
                                type="primary"
                                :disabled="disabled || !canContinue"
                                @click="creation.applyCreation"
                                >Создать персонажа</NButton
                            >
                        </footer>
                    </section>
                </Transition>
            </div>

            <CreationPreview v-if="!hidePreview" :model="creation" :level="character.level" />
        </div>
    </div>
</template>
