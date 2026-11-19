<script setup lang="ts">
import { NFormItem, NInput, NInputNumber } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'

const { character } = useCharacterSheet()

function numberValue(value: number | null) {
    return value !== null && Number.isFinite(value) ? value : 0
}

function updateArmorValue(value: number | null) {
    if (!character.value) return
    character.value.combat.armorClass.mode = 'manual'
    character.value.combat.armorClass.value = numberValue(value)
}
</script>

<template>
    <div v-if="character">
        <div class="flex gap-4 items-end">
            <NFormItem label="КД">
                <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.armorClass.value"
                    @update:value="updateArmorValue" />
            </NFormItem>
            <div>
                <NFormItem label="Доп. бонус инициативы">
                    <NInputNumber button-placement="both" step="1" :value="character.combat.initiative.additionalBonus"
                        @update:value="character.combat.initiative.additionalBonus = numberValue($event)" />
                </NFormItem>
            </div>
            <NFormItem label="Скорость">
                <NInputNumber button-placement="both" min="0" :value="character.combat.speed"
                    @update:value="character.combat.speed = numberValue($event)" />
            </NFormItem>
        </div>
        <div>
            <h3>Хиты</h3>
            <div class="flex gap-4 items-end">
                <NFormItem label="Максимум">
                    <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.hitPoints.max"
                        @update:value="character.combat.hitPoints.max = numberValue($event)" />
                </NFormItem>
                <NFormItem label="Текущие">
                    <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.hitPoints.current"
                        @update:value="character.combat.hitPoints.current = numberValue($event)" />
                </NFormItem>
                <NFormItem label="Временные">
                    <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.hitPoints.temporary"
                        @update:value="character.combat.hitPoints.temporary = numberValue($event)" />
                </NFormItem>
            </div>
        </div>
        <div>
            <h3>Кости хитов</h3>
            <div class="flex gap-4 items-end">
                <NFormItem label="Размер (например, d8)">
                    <NInput
                        :value="character.combat.hitDice.size"
                        @update:value="character.combat.hitDice.size = $event.trim()"
                    />
                </NFormItem>
                <NFormItem label="Всего">
                    <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.hitDice.total"
                        @update:value="character.combat.hitDice.total = numberValue($event)" />
                </NFormItem>
                <NFormItem label="Потрачено">
                    <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.hitDice.spent"
                        @update:value="character.combat.hitDice.spent = numberValue($event)" />
                </NFormItem>
            </div>
        </div>
        <div>
            <h3>Спасброски от смерти</h3>
            <div class="flex gap-4 items-end">
                <NFormItem label="Успехи">
                    <NInputNumber button-placement="both" min="0" max="3" step="1"
                        :value="character.combat.deathSaves.successes"
                        @update:value="character.combat.deathSaves.successes = numberValue($event)" />
                </NFormItem>
                <NFormItem label="Провалы">
                    <NInputNumber button-placement="both" min="0" max="3" step="1"
                        :value="character.combat.deathSaves.failures"
                        @update:value="character.combat.deathSaves.failures = numberValue($event)" />
                </NFormItem>
            </div>
        </div>
    </div>
</template>
