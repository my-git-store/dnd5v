<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { classIconFor } from '@/data/classIcons'

import { spellProgressionLabel } from '../../utils/creationLabels'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<CharacterCreationModel, 'classOptions' | 'classId' | 'gender' | 'skillLabels'>
    >
    disabled?: boolean
}
type Emits = {
    selectClass: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { classOptions, classId, gender, skillLabels } = toRefs(props.model)
</script>

<template>
    <div class="creation-step-content">
        <div class="selection-grid class-selection-grid" role="group" aria-label="Выберите класс">
            <button
                v-for="item in classOptions"
                :key="item.id"
                type="button"
                class="selection-card"
                :class="{ selected: classId === item.id }"
                :aria-pressed="classId === item.id"
                :disabled="disabled"
                @click="emit('selectClass', item.id)"
            >
                <span class="selection-card-top"
                    ><span class="class-icon" aria-hidden="true"
                        ><img
                            v-if="classIconFor(item.id, gender)"
                            :src="classIconFor(item.id, gender)"
                            class="class-card-image"
                            :alt="`Иллюстрация класса «${item.label}» (${gender === 'male' ? 'мужской' : 'женский'} вариант)`"
                            loading="lazy"
                        /><span v-else class="class-icon-fallback">{{ item.hitDie }}</span></span
                    ><span v-if="classId === item.id" class="selection-check" aria-label="Выбрано"
                        >✓</span
                    ></span
                ><strong>{{ item.label }}</strong
                ><span class="selection-description">{{
                    item.description
                        ? `${item.description} Основная характеристика: ${ABILITY_FIELDS.find(field => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}`
                        : `Основная характеристика: ${ABILITY_FIELDS.find(field => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}`
                }}</span
                ><span class="selection-traits">Особенности: {{ item.features.join(' · ') }}</span
                ><span class="selection-origin"
                    >Спасброски:
                    {{
                        item.savingThrowKeys
                            .map(
                                key =>
                                    ABILITY_FIELDS.find(field => field.key === key)?.label ?? key,
                            )
                            .join(' · ')
                    }}</span
                ><span class="selection-origin"
                    >Навыки:
                    {{ item.skillOptions.map(id => skillLabels[id] ?? id).join(' · ') }}
                    · выбрать {{ item.skillChoiceCount }}</span
                ><span v-if="item.weaponProficiencies?.length" class="selection-origin"
                    >Оружие: {{ item.weaponProficiencies.join(' · ') }}</span
                ><span v-if="item.armorProficiencies?.length" class="selection-origin"
                    >Броня: {{ item.armorProficiencies.join(' · ') }}</span
                ><span v-if="item.startingEquipment?.length" class="selection-origin"
                    >Снаряжение:
                    {{ item.startingEquipment.map(kit => kit.label).join(' · ') }}</span
                ><span class="selection-origin">{{
                    item.spellcastingAbility
                        ? `Магия: ${ABILITY_FIELDS.find(field => field.key === item.spellcastingAbility)?.label} · ${spellProgressionLabel(item.spellProgressionType)}`
                        : 'Без заклинаний на этом шаге'
                }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped src="../styles/creation-selection.css"></style>
<style scoped>
.class-icon {
    display: grid;
    place-items: center;
    width: 128px;
    height: 128px;
    overflow: hidden;
    border: 1px solid #d5c19b;
    border-radius: 50%;
    background: #f8efd9;
    color: #75552e;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
}
.selection-card:hover:not(:disabled) .class-icon {
    border-color: #b18a53;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 3px 8px rgba(78, 53, 26, 0.12);
    transform: scale(1.02);
}
.selection-card.selected .class-icon {
    border-color: #8b5b39;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 0 0 3px rgba(155, 106, 47, 0.13);
}
.class-card-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.class-icon-fallback {
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 800;
}
</style>
