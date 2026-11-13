<script setup lang="ts">
import { NFormItem, NInputNumber } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterMoney } from '@/types/character'

const { character } = useCharacterSheet()

const fields: Array<{ key: keyof CharacterMoney; label: string }> = [
    { key: 'copper', label: 'Медь' },
    { key: 'silver', label: 'Серебро' },
    { key: 'electrum', label: 'Электрум' },
    { key: 'gold', label: 'Золото' },
    { key: 'platinum', label: 'Платина' },
]
</script>
<template>
    <section v-if="character">
        <h2>Деньги</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div v-for="field in fields" :key="field.key">
                <NFormItem :label="field.label"
                    ><NInputNumber
                        button-placement="both"
                        min="0"
                        :value="character.inventory.money[field.key]"
                        @update:value="
                            character.inventory.money[field.key] = Math.max(0, Math.trunc($event || 0))
                        "
                /></NFormItem>
            </div>
        </div>
    </section>
</template>
