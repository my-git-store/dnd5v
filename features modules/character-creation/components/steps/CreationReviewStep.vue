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
    selectedClass,
    finalAbility,
    previewFeatures,
    previewEquipment,
} = toRefs(props.model)
</script>

<template>
    <div class="grid gap-4">
        <div v-if="!isCompleted">
            <div aria-hidden="true">✦</div>
            <p>Последняя проверка</p>
            <h3>{{ name.trim() || 'Безымянный герой' }}</h3>
            <p>
                {{ selectedRace.label }} · {{ selectedBackground.label }}
                ·
                {{ selectedClass.label }}
            </p>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <span v-for="field in ABILITY_FIELDS" :key="field.key"
                    ><small>{{ field.label.slice(0, 3) }}</small
                    ><b>{{ finalAbility(field.key) }}</b
                    ><em>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</em></span
                >
            </div>
            <div>
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
            <div>
                <span aria-hidden="true">✧</span>
                <p>
                    После создания изменения останутся черновиком. Используйте общую кнопку
                    «Сохранить» на листе, чтобы записать персонажа.
                </p>
            </div>
        </div>
        <div v-else>
            <div aria-hidden="true">✦</div>
            <p>Путь начинается</p>
            <h3>Персонаж готов</h3>
            <p>
                {{ name }} — {{ selectedRace.label }} · {{ selectedBackground.label }},
                {{ selectedClass.label }}.
            </p>
            <div class="flex flex-wrap items-center gap-2">
                <NButton type="primary" @click="emit('backToSheet')">Открыть лист персонажа</NButton
                ><NButton @click="emit('edit')">Изменить</NButton>
            </div>
        </div>
    </div>
</template>
