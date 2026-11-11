<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'

import { hideBrokenAsset, sourceLabel } from '../utils/creationLabels'
import type { CharacterCreationModel } from '../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'currentStep'
            | 'selectedSpeciesIcon'
            | 'selectedRace'
            | 'initials'
            | 'name'
            | 'selectedBackground'
            | 'selectedSubrace'
            | 'selectedClass'
            | 'selectedBackgroundIcon'
            | 'finalAbility'
            | 'currentOwnedSkills'
            | 'skillLabels'
            | 'previewFeatures'
            | 'previewEquipment'
        >
    >
    level: number
}

const props = defineProps<Props>()

const {
    currentStep,
    selectedSpeciesIcon,
    selectedRace,
    initials,
    name,
    selectedBackground,
    selectedSubrace,
    selectedClass,
    selectedBackgroundIcon,
    finalAbility,
    currentOwnedSkills,
    skillLabels,
    previewFeatures,
    previewEquipment,
} = toRefs(props.model)
</script>

<template>
    <aside
        class="character-preview"
        :class="{ compact: currentStep !== 9 }"
        aria-label="Предпросмотр персонажа"
        aria-live="polite"
    >
        <div class="preview-bookmark">Лист героя · предпросмотр</div>
        <div class="preview-portrait">
            <span v-if="selectedSpeciesIcon" class="portrait-frame species-preview-frame"
                ><span
                    data-asset-fallback
                    class="species-icon-fallback"
                    :hidden="Boolean(selectedSpeciesIcon)"
                    >{{ selectedRace.label.slice(0, 1) }}</span
                ><img
                    :src="selectedSpeciesIcon"
                    :alt="`Иконка вида «${selectedRace.label}»`"
                    @error="hideBrokenAsset" /></span
            ><span v-else class="portrait-frame"
                ><span>{{ initials }}</span></span
            ><span class="portrait-caption">{{
                selectedSpeciesIcon ? 'Иконка вида' : 'Портрет появится позже'
            }}</span>
        </div>
        <div class="preview-identity">
            <p class="c-eyebrow">Новый искатель приключений</p>
            <h2>{{ name.trim() || 'Имя героя' }}</h2>
            <p>
                {{ selectedRace.label }} · {{ selectedBackground.label
                }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span>
            </p>
            <div class="preview-class-row">
                <span>{{ selectedClass.label }}</span
                ><span>Уровень {{ level }}</span>
            </div>
            <div v-if="selectedBackgroundIcon" class="preview-background-row">
                <span class="background-preview-icon"
                    ><span data-asset-fallback :hidden="Boolean(selectedBackgroundIcon)">{{
                        selectedBackground.label.slice(0, 1)
                    }}</span
                    ><img
                        :src="selectedBackgroundIcon"
                        :alt="`Иконка предыстории «${selectedBackground.label}»`"
                        @error="hideBrokenAsset" /></span
                ><span>Предыстория: {{ selectedBackground.label }}</span>
            </div>
        </div>
        <div class="preview-divider"><span>Характеристики</span></div>
        <div class="preview-ability-grid">
            <div v-for="field in ABILITY_FIELDS" :key="field.key">
                <small>{{ field.label }}</small
                ><b>{{ finalAbility(field.key) }}</b
                ><span>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</span>
            </div>
        </div>
        <div class="preview-section">
            <h3>Владения</h3>
            <div v-if="currentOwnedSkills.length" class="preview-badges">
                <span
                    v-for="skill in currentOwnedSkills.slice(0, 8)"
                    :key="skill.id"
                    class="preview-skill"
                    ><b>{{ skillLabels[skill.id] ?? skill.name }}</b
                    ><small>{{ skill.sources.map(sourceLabel).join(' + ') }}</small></span
                >
            </div>
            <p v-else class="preview-muted">Выберите навыки, чтобы увидеть владения.</p>
        </div>
        <div class="preview-section">
            <h3>Особенности</h3>
            <ul class="preview-feature-list">
                <li
                    v-for="feature in previewFeatures.slice(0, currentStep === 9 ? 8 : 3)"
                    :key="feature"
                >
                    {{ feature }}
                </li>
            </ul>
        </div>
        <div class="preview-section">
            <h3>Стартовое снаряжение</h3>
            <ul v-if="previewEquipment.length" class="preview-equipment-list">
                <li
                    v-for="(item, index) in previewEquipment.slice(0, currentStep === 9 ? 8 : 4)"
                    :key="`${item.source}-${item.name}-${index}`"
                >
                    {{ item.name }} <span>× {{ item.quantity }}</span>
                </li>
            </ul>
            <p v-else class="preview-muted">Пока не выбрано</p>
        </div>
        <p class="preview-draft-note">Изменения пока не сохранены</p>
    </aside>
</template>

<style scoped src="./styles/creation-preview.css"></style>
