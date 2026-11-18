<script setup lang="ts">
import { NFormItem, NInput, NInputNumber } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'

const { character } = useCharacterSheet()

function integerValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? Math.trunc(value) : 0
}

function updateLevel(value: number | null) {
    if (!character.value) return
    character.value.identity.level = Math.min(20, Math.max(1, integerValue(value)))
}
</script>

<template>
    <div v-if="character">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NFormItem label="Вид" :show-feedback="false">
                <NInput
                    :value="character.identity.race.name"
                    :input-props="{ 'aria-label': 'Вид' }"
                    @update:value="character.identity.race.name = $event.trim()"
                />
            </NFormItem>
            <NFormItem label="Класс" :show-feedback="false">
                <NInput
                    :value="character.identity.class"
                    :input-props="{ 'aria-label': 'Класс' }"
                    @update:value="character.identity.class = $event.trim()"
                />
            </NFormItem>
            <NFormItem label="Подкласс" :show-feedback="false">
                <NInput
                    :value="character.identity.subclass"
                    :input-props="{ 'aria-label': 'Подкласс' }"
                    @update:value="character.identity.subclass = $event.trim()"
                />
            </NFormItem>
            <NFormItem label="Мировоззрение" :show-feedback="false">
                <NInput
                    :value="character.identity.alignment"
                    :input-props="{ 'aria-label': 'Мировоззрение' }"
                    @update:value="character.identity.alignment = $event.trim()"
                />
            </NFormItem>
            <NFormItem label="Уровень" :show-feedback="false">
                <NInputNumber button-placement="both" :min="1" :step="1" :value="character.identity.level"
                    :input-props="{ 'aria-label': 'Уровень' }" @update:value="updateLevel($event)" />
            </NFormItem>
            <NFormItem label="Опыт" :show-feedback="false">
                <NInputNumber button-placement="both" :min="0" :step="1" :value="character.identity.experience"
                    :input-props="{ 'aria-label': 'Опыт' }"
                    @update:value="character.identity.experience = Math.max(0, integerValue($event))" />
            </NFormItem>
        </div>
    </div>
</template>
