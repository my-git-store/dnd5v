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
    <div class="grid gap-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NFormItem label="Имя персонажа">
                <NInput
                    :value="name"
                    :disabled="disabled"
                    autocomplete="off"
                    @update:value="emit('updateName', $event)"
                />
            </NFormItem>
            <NFormItem label="Мировоззрение (необязательно)">
                <NInput
                    :value="alignment"
                    :disabled="disabled"
                    @update:value="emit('updateAlignment', String($event ?? ''))"
                />
            </NFormItem>
            <NFormItem label="Подкласс (позже)">
                <NInput
                    :value="subclass"
                    :disabled="disabled"
                    @update:value="emit('updateSubclass', String($event ?? ''))"
                />
            </NFormItem>
            <fieldset>
                <legend>Пол персонажа</legend>
                <div role="radiogroup" aria-label="Пол персонажа">
                    <NButton
                        :type="gender === 'female' ? 'primary' : 'default'"
                        native-type="button"
                        :aria-pressed="gender === 'female'"
                        :disabled="disabled"
                        @click="emit('updateGender', 'female')"
                    >
                        Женский
                    </NButton>
                    <NButton
                        :type="gender === 'male' ? 'primary' : 'default'"
                        native-type="button"
                        :aria-pressed="gender === 'male'"
                        :disabled="disabled"
                        @click="emit('updateGender', 'male')"
                    >
                        Мужской
                    </NButton>
                </div>
            </fieldset>
        </div>
        <div>
            <span aria-hidden="true">✧</span>
            <p>Имя можно изменить позднее. Ваш выбор пока остаётся в черновике листа.</p>
        </div>
    </div>
</template>
