<script setup lang="ts">
import { toRefs } from 'vue'

import type { CharacterGender } from '@/types/character'

import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<Pick<CharacterCreationModel, 'name' | 'alignment' | 'subclass' | 'gender'>>
    disabled?: boolean
}
type Emits = {
    updateName: [name: string]
    updateGender: [gender: CharacterGender]
    updateAlignment: [alignment: string]
    updateSubclass: [subclass: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { name, alignment, subclass, gender } = toRefs(props.model)
</script>

<template>
    <div class="creation-step-content">
        <div class="creator-grid creation-identity-fields">
            <NFormItem label="Имя персонажа"
                ><NInput
                    :value="name"
                    :disabled="disabled"
                    autocomplete="off"
                    @update:value="emit('updateName', $event)"
            /></NFormItem>
            <NFormItem label="Мировоззрение (необязательно)"
                ><NInput
                    :value="alignment"
                    :disabled="disabled"
                    @update:value="emit('updateAlignment', String($event ?? ''))"
            /></NFormItem>
            <NFormItem label="Подкласс (позже)"
                ><NInput
                    :value="subclass"
                    :disabled="disabled"
                    @update:value="emit('updateSubclass', String($event ?? ''))"
            /></NFormItem>
            <fieldset class="c-gender-choice">
                <legend>Пол персонажа</legend>
                <div class="c-gender-choice-options" role="radiogroup" aria-label="Пол персонажа">
                    <button
                        type="button"
                        class="c-gender-choice-button"
                        :class="{ selected: gender === 'female' }"
                        :aria-pressed="gender === 'female'"
                        :disabled="disabled"
                        @click="emit('updateGender', 'female')"
                    >
                        Женский
                    </button>
                    <button
                        type="button"
                        class="c-gender-choice-button"
                        :class="{ selected: gender === 'male' }"
                        :aria-pressed="gender === 'male'"
                        :disabled="disabled"
                        @click="emit('updateGender', 'male')"
                    >
                        Мужской
                    </button>
                </div>
            </fieldset>
        </div>
        <div class="creation-callout">
            <span aria-hidden="true">✧</span>
            <p>
                Персонаж создаётся по правилам D&amp;D 2024. Имя можно изменить позднее. Ваш выбор
                пока остаётся в черновике листа.
            </p>
        </div>
    </div>
</template>

<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.creator-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
}
.creation-identity-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.creation-identity-fields > :first-child {
    grid-column: 1 / -1;
}
</style>
