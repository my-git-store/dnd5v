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
    <aside class="grid gap-4" aria-label="Предпросмотр персонажа" aria-live="polite">
        <div>Лист героя · предпросмотр</div>
        <div>
            <span
                v-if="selectedSpeciesIcon"
                class="inline-flex size-24 shrink-0 items-center justify-center"
                ><span data-asset-fallback :hidden="Boolean(selectedSpeciesIcon)">{{
                    selectedRace.label.slice(0, 1)
                }}</span
                ><img
                    :src="selectedSpeciesIcon"
                    :alt="`Иконка вида «${selectedRace.label}»`"
                    @error="hideBrokenAsset" /></span
            ><span v-else class="inline-flex size-24 shrink-0 items-center justify-center"
                ><span>{{ initials }}</span></span
            ><span>{{ selectedSpeciesIcon ? 'Иконка вида' : 'Портрет появится позже' }}</span>
        </div>
        <div>
            <p>Новый искатель приключений</p>
            <h2>{{ name.trim() || 'Имя героя' }}</h2>
            <p>{{ selectedRace.label }} · {{ selectedBackground.label }}</p>
            <div>
                <span>{{ selectedClass.label }}</span
                ><span>Уровень {{ level }}</span>
            </div>
            <div v-if="selectedBackgroundIcon">
                <span class="inline-flex size-8 shrink-0 items-center justify-center"
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
        <div><span>Характеристики</span></div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div v-for="field in ABILITY_FIELDS" :key="field.key">
                <small>{{ field.label }}</small
                ><b>{{ finalAbility(field.key) }}</b
                ><span>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</span>
            </div>
        </div>
        <div>
            <h3>Владения</h3>
            <div v-if="currentOwnedSkills.length">
                <span v-for="skill in currentOwnedSkills.slice(0, 8)" :key="skill.id"
                    ><b>{{ skillLabels[skill.id] ?? skill.name }}</b
                    ><small>{{ skill.sources.map(sourceLabel).join(' + ') }}</small></span
                >
            </div>
            <p v-else>Выберите навыки, чтобы увидеть владения.</p>
        </div>
        <div>
            <h3>Особенности</h3>
            <ul>
                <li
                    v-for="feature in previewFeatures.slice(0, currentStep === 9 ? 8 : 3)"
                    :key="feature"
                >
                    {{ feature }}
                </li>
            </ul>
        </div>
        <div>
            <h3>Стартовое снаряжение</h3>
            <ul v-if="previewEquipment.length">
                <li
                    v-for="(item, index) in previewEquipment.slice(0, currentStep === 9 ? 8 : 4)"
                    :key="`${item.source}-${item.name}-${index}`"
                >
                    {{ item.name }} <span>× {{ item.quantity }}</span>
                </li>
            </ul>
            <p v-else>Пока не выбрано</p>
        </div>
        <p>Изменения пока не сохранены</p>
    </aside>
</template>
