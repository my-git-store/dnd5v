<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import type { AbilityKey } from '@/types/character'

import { hideBrokenAsset } from '../../utils/creationLabels'
import CreationEquipmentChoices from '../CreationEquipmentChoices.vue'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'backgroundOptions'
            | 'backgroundId'
            | 'skillLabels'
            | 'selectedModernBackground'
            | 'backgroundAbilityChoices'
            | 'originAbilityFocus'
            | 'selectedBackground'
            | 'backgroundEquipmentOptions'
            | 'backgroundEquipmentId'
        >
    >
    disabled?: boolean
}
type Emits = {
    selectBackground: [id: string]
    toggleBackgroundAbility: [key: AbilityKey]
    selectOriginAbilityFocus: [key: AbilityKey]
    selectBackgroundKit: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
    backgroundOptions,
    backgroundId,
    skillLabels,
    selectedModernBackground,
    backgroundAbilityChoices,
    originAbilityFocus,
    selectedBackground,
    backgroundEquipmentOptions,
    backgroundEquipmentId,
} = toRefs(props.model)
</script>

<template>
    <div class="grid gap-4">
        <div
            class="grid grid-cols-1 gap-3 sm:grid-cols-2"
            role="group"
            aria-label="Выберите предысторию"
        >
            <NButton
                v-for="background in backgroundOptions"
                :key="background.id"
                :type="backgroundId === background.id ? 'primary' : 'default'"
                native-type="button"
                class="h-auto! whitespace-normal!"
                :aria-pressed="backgroundId === background.id"
                :disabled="disabled"
                @click="emit('selectBackground', background.id)"
            >
                <span class="flex w-full items-center justify-between gap-2"
                    ><span
                        class="inline-flex size-24 shrink-0 items-center justify-center"
                        aria-hidden="true"
                        ><span data-asset-fallback :hidden="Boolean(background.icon)">{{
                            background.label.slice(0, 1)
                        }}</span
                        ><img
                            v-if="background.icon"
                            :src="background.icon"
                            :alt="`Иконка предыстории «${background.label}»`"
                            loading="lazy"
                            @error="hideBrokenAsset" /></span
                    ><span v-if="backgroundId === background.id" aria-label="Выбрано">✓</span></span
                >
                <strong>{{ background.label }}</strong>
                <span>{{ background.description }}</span>
                <span
                    >Навыки:
                    {{
                        background.skillProficiencies
                            .map(id => skillLabels[id] ?? id)
                            .join(' · ') || 'не указаны'
                    }}</span
                >
                <span
                    >Инструменты:
                    {{ background.toolProficiencies.join(' · ') || 'не указаны' }}</span
                >
                <span>{{
                    background.originFeatLabel
                        ? `Черта происхождения: ${background.originFeatLabel}`
                        : `Особенность: ${background.feature}`
                }}</span>
                <span v-if="background.languages.length"
                    >Языки: {{ background.languages.join(' · ') }}</span
                >
            </NButton>
        </div>
        <div>
            <div>
                <strong>Бонусы характеристик</strong
                ><small
                    >Выберите три характеристики. Одна выбранная характеристика получает +2, две
                    другие — +1.</small
                >
            </div>
            <div role="group" aria-label="Характеристики предыстории">
                <NButton
                    v-for="key in selectedModernBackground?.abilityOptions ?? []"
                    :key="key"
                    :type="backgroundAbilityChoices.includes(key) ? 'primary' : 'default'"
                    native-type="button"
                    :aria-pressed="backgroundAbilityChoices.includes(key)"
                    :disabled="
                        disabled ||
                        (!backgroundAbilityChoices.includes(key) &&
                            backgroundAbilityChoices.length >= 3)
                    "
                    @click="emit('toggleBackgroundAbility', key)"
                >
                    {{ ABILITY_FIELDS.find(field => field.key === key)?.label ?? key }}
                </NButton>
            </div>
            <div>
                <span>Бонус +2:</span
                ><NButton
                    v-for="key in backgroundAbilityChoices"
                    :key="`focus-${key}`"
                    :type="originAbilityFocus === key ? 'primary' : 'default'"
                    native-type="button"
                    :aria-pressed="originAbilityFocus === key"
                    :disabled="disabled"
                    @click="emit('selectOriginAbilityFocus', key)"
                >
                    {{ ABILITY_FIELDS.find(field => field.key === key)?.label ?? key }}
                </NButton>
            </div>
            <small v-if="selectedModernBackground?.originFeatId"
                >Черта происхождения: {{ selectedBackground.originFeatLabel
                }}<span v-if="selectedBackground.originFeatDescription">
                    — {{ selectedBackground.originFeatDescription }}</span
                ></small
            >
        </div>
        <div v-if="backgroundEquipmentOptions.length">
            <div>
                <h3>Набор предыстории · {{ selectedBackground.label }}</h3>
                <p>
                    Выберите один вариант — его предметы и деньги попадут в инвентарь при создании.
                </p>
            </div>
            <CreationEquipmentChoices
                :options="backgroundEquipmentOptions"
                :selected-id="backgroundEquipmentId"
                :disabled="disabled"
                @select="emit('selectBackgroundKit', $event)"
            />
        </div>
    </div>
</template>
