<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'

import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'isCompleted'
            | 'name'
            | 'selectedRace'
            | 'selectedBackground'
            | 'selectedSubrace'
            | 'selectedClass'
            | 'finalAbility'
            | 'previewFeatures'
            | 'previewEquipment'
        >
    >
}
type Emits = {
    backToSheet: []
    edit: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
    isCompleted,
    name,
    selectedRace,
    selectedBackground,
    selectedSubrace,
    selectedClass,
    finalAbility,
    previewFeatures,
    previewEquipment,
} = toRefs(props.model)
</script>

<template>
    <div class="creation-step-content">
        <div v-if="!isCompleted" class="creation-review">
            <div class="review-medallion" aria-hidden="true">✦</div>
            <p class="c-eyebrow">Последняя проверка</p>
            <h3>{{ name.trim() || 'Безымянный герой' }}</h3>
            <p class="review-identity">
                {{ selectedRace.label }} · {{ selectedBackground.label
                }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span>
                ·
                {{ selectedClass.label }}
            </p>
            <div class="review-abilities">
                <span v-for="field in ABILITY_FIELDS" :key="field.key"
                    ><small>{{ field.label.slice(0, 3) }}</small
                    ><b>{{ finalAbility(field.key) }}</b
                    ><em>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</em></span
                >
            </div>
            <div class="review-bottom">
                <div>
                    <strong>Особенности</strong>
                    <p>{{ previewFeatures.slice(0, 5).join(' · ') }}</p>
                </div>
                <div>
                    <strong>Снаряжение</strong>
                    <p>
                        {{
                            previewEquipment
                                .map(item => `${item.name} × ${item.quantity}`)
                                .join(' · ')
                        }}
                    </p>
                </div>
            </div>
            <div class="creation-callout">
                <span aria-hidden="true">✧</span>
                <p>
                    После создания изменения останутся черновиком. Используйте общую кнопку
                    «Сохранить» на листе, чтобы записать персонажа.
                </p>
            </div>
        </div>
        <div v-else class="creation-finished">
            <div class="finished-seal" aria-hidden="true">✦</div>
            <p class="c-eyebrow">Путь начинается</p>
            <h3>Персонаж готов</h3>
            <p>
                {{ name }} — {{ selectedRace.label }} · {{ selectedBackground.label
                }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span
                >, {{ selectedClass.label }}.
            </p>
            <div class="finished-actions">
                <NButton type="primary" @click="emit('backToSheet')">Открыть лист персонажа</NButton
                ><NButton @click="emit('edit')">Изменить</NButton>
            </div>
        </div>
    </div>
</template>

<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.creation-review {
    text-align: center;
}
.review-medallion,
.finished-seal {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin: 0 auto 12px;
    border: 1px solid #b99967;
    border-radius: 50%;
    background: radial-gradient(circle, #fff7df, #e9d5ab);
    box-shadow: 0 0 0 5px rgba(180, 145, 84, 0.1);
    color: #8d652f;
    font-size: 1.6rem;
}
.creation-review h3,
.creation-finished h3 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1.55rem;
}
.review-identity {
    margin: 6px 0 17px;
    color: #785b3b;
}
.review-abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
}
.review-abilities > span {
    display: grid;
    gap: 3px;
    padding: 8px 4px;
    border: 1px solid #ddc99f;
    border-radius: 9px;
    background: #fbf0d5;
}
.review-abilities small {
    color: #8b7453;
    font-size: 0.62rem;
    text-transform: uppercase;
}
.review-abilities b {
    color: #493420;
    font-size: 1.1rem;
}
.review-abilities em {
    color: #845a2c;
    font-size: 0.76rem;
    font-style: normal;
    font-weight: 800;
}
.review-bottom {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 17px;
    text-align: left;
}
.review-bottom > div {
    padding: 11px;
    border: 1px solid #e1d1b3;
    border-radius: 9px;
    background: rgba(255, 249, 235, 0.65);
}
.review-bottom strong {
    color: #604238;
    font-family: var(--font-serif);
    font-size: 0.78rem;
}
.review-bottom p {
    margin: 5px 0 0;
    color: #746047;
    font-size: 0.72rem;
    line-height: 1.45;
}
.creation-finished {
    display: grid;
    justify-items: center;
    align-content: center;
    min-height: 450px;
    padding: 30px 16px;
    border: 1px solid #c5a96f;
    border-radius: 12px;
    background:
        radial-gradient(ellipse at 50% 40%, rgba(234, 211, 165, 0.55), transparent 58%),
        linear-gradient(145deg, #fff9e9, #f0dfbf);
    text-align: center;
    animation: creation-finish-in 0.55s both;
}
.finished-seal {
    width: 82px;
    height: 82px;
    margin-bottom: 17px;
    font-size: 2.2rem;
    box-shadow:
        0 0 0 8px rgba(180, 145, 84, 0.1),
        0 8px 25px rgba(92, 62, 25, 0.12);
}
.creation-finished .c-eyebrow {
    margin-bottom: 6px;
}
.creation-finished h3 {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
}
.creation-finished > p:not(.c-eyebrow) {
    max-width: 440px;
    color: #755a3e;
    line-height: 1.5;
}
.finished-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
}
@keyframes creation-finish-in {
    from {
        opacity: 0;
        transform: scale(0.985);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
