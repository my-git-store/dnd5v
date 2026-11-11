<script setup lang="ts">
import { reactive, toRefs } from 'vue'

import type { CharacterCreationPayload } from '@/domain/characterCreation'
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
    <div class="c-tab-content creation-tab">
        <CreationHeader :model="creation" />
        <CreationStepNavigation
            :model="creation"
            :disabled="disabled"
            @select-step="creation.goToStep"
        />

        <div class="creation-workspace">
            <div class="creation-main-column">
                <Transition name="creation-step" mode="out-in">
                    <section
                        :key="currentStep"
                        class="c-sheet-section creation-step-panel"
                        :aria-labelledby="`creation-step-title-${currentStep}`"
                    >
                        <div class="creation-panel-heading">
                            <div>
                                <p class="c-eyebrow">
                                    Этап {{ String(currentStep).padStart(2, '0') }}
                                </p>
                                <h2 :id="`creation-step-title-${currentStep}`">
                                    {{ stepLabel(currentStep - 1) }}
                                </h2>
                                <p class="c-section-note">{{ stepDescription(currentStep - 1) }}</p>
                            </div>
                            <span class="creation-rune" aria-hidden="true">{{
                                currentStep === 9 ? '✧' : '✦'
                            }}</span>
                        </div>

                        <div
                            v-if="stepIssue || props.creationError"
                            class="creation-error"
                            role="alert"
                        >
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
                        <footer v-if="!isCompleted" class="creation-navigation">
                            <NButton
                                :disabled="disabled || currentStep === 1"
                                @click="creation.previousStep"
                                >Назад</NButton
                            ><span class="navigation-step-caption"
                                >{{ currentStep }} / {{ steps.length }}</span
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

<style scoped src="./styles/creation-sections.css"></style>
<style scoped>
.creation-navigation {
    align-items: center;
}
.creation-tab {
    display: block;
}
.creation-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 322px);
    align-items: start;
    gap: 18px;
}
.creation-main-column {
    min-width: 0;
}
.creation-step-panel {
    min-height: 540px;
}
.creation-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 24px;
    padding-top: 15px;
    border-top: 1px solid #eadcc3;
}
.navigation-step-caption {
    color: #88745c;
    font-size: 0.78rem;
    font-weight: 700;
}
.creation-error {
    margin: 0 0 16px;
    padding: 11px 13px;
    border: 1px solid #d7aaa1;
    border-left: 4px solid #9c4842;
    border-radius: 8px;
    background: #fff0eb;
    color: #74352e;
    font-size: 0.86rem;
    line-height: 1.4;
}
.creation-step-enter-active,
.creation-step-leave-active {
    transition:
        opacity 0.16s ease,
        transform 0.16s ease;
}
.creation-step-enter-from {
    opacity: 0;
    transform: translateY(7px);
}
.creation-step-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
.creation-step-panel {
    border-radius: 10px;
    border-color: #c4a474;
    box-shadow:
        0 7px 18px rgba(83, 59, 38, 0.08),
        inset 0 1px rgba(255, 255, 255, 0.7);
}
.creation-step-panel {
    background: linear-gradient(145deg, rgba(255, 250, 239, 0.93), rgba(249, 235, 207, 0.8));
}
</style>
