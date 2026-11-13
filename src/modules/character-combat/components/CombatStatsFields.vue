<script setup lang="ts">
import { computed } from 'vue'
import { NFormItem, NInput, NInputNumber } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { signedModifier } from '@/domain/abilityModifier'
import { calculateInitiative } from '@/domain/combatCalculations'

const { character } = useCharacterSheet()

const initiative = computed(() => {
    if (!character.value) return 0
    return (
        calculateInitiative(
            character.value.abilities,
            character.value.combat.initiative.additionalBonus,
        ) ?? 0
    )
})

const speed = computed(
    () => character.value?.combat.speed.override ?? character.value?.combat.speed.base,
)

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
    <section v-if="character">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3>Класс доспеха</h3>
                    <p>{{ character.combat.armorClass.value }}</p>
                    <span>Ручное значение</span>
                </div>
                <p>Расчёт КД не настроен — укажите итоговое значение вручную.</p>
                <NFormItem label="КД">
                    <NInputNumber button-placement="both" min="0" step="1" :value="character.combat.armorClass.value"
                        @update:value="updateArmorValue" />
                </NFormItem>
            </div>
            <div>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3>Инициатива</h3>
                    <p>{{ signedModifier(initiative) }}</p>
                    <span>Расчёт</span>
                </div>
                <p>Модификатор Ловкости + добавка</p>
                <NFormItem label="Доп. бонус инициативы">
                    <NInputNumber button-placement="both" step="1" :value="character.combat.initiative.additionalBonus"
                        @update:value="character.combat.initiative.additionalBonus = numberValue($event)" />
                </NFormItem>
            </div>
            <div>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3>Скорость</h3>
                    <p>{{ speed }}</p>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NFormItem label="Базовая">
                        <NInputNumber button-placement="both" min="0" :value="character.combat.speed.base"
                            @update:value="character.combat.speed.base = numberValue($event)" />
                    </NFormItem>
                    <NFormItem label="Переопределение">
                        <NInputNumber v-model:value="character.combat.speed.override" button-placement="both" min="0"
                            />
                    </NFormItem>
                    <NFormItem label="Полёт">
                        <NInputNumber v-model:value="character.combat.speed.fly" button-placement="both" min="0"
                            />
                    </NFormItem>
                    <NFormItem label="Плавание">
                        <NInputNumber v-model:value="character.combat.speed.swim" button-placement="both" min="0"
                            />
                    </NFormItem>
                </div>
            </div>
            <div>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3>Хиты</h3>
                    <p>{{ character.combat.hitPoints.current }} / {{ character.combat.hitPoints.max }}</p>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3>Кости хитов</h3>
                    <p>{{ character.combat.hitDice.spent }} / {{ character.combat.hitDice.total }}</p>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NFormItem label="Размер (например, d8)">
                        <NInput v-model:value="character.combat.hitDice.size" />
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
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3>Спасброски от смерти</h3>
                    <p>
                        {{ character.combat.deathSaves.successes }} / 3 · {{ character.combat.deathSaves.failures }} / 3
                    </p>
                </div>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
    </section>
</template>
