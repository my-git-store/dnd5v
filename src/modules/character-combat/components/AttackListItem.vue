<script setup lang="ts">
import { NButton, NCollapseItem, NFormItem, NInput, NInputNumber, NSelect } from 'naive-ui'

import type {
    CharacterAttackDamageRecord,
    CharacterAttackRecord,
} from '@/types/character'
import { getEntryKey } from '@/utils/getEntryKey'
import AttackDamageRow from './AttackDamageRow.vue'

const attack = defineModel<CharacterAttackRecord>('attack', { required: true })

const emit = defineEmits<{ remove: [] }>()

const kindLabels: Record<CharacterAttackRecord['kind'], string> = {
    melee: 'Ближняя',
    ranged: 'Дальняя',
    spell: 'Заклинание',
    other: 'Другое',
}

const attackKinds = Object.entries(kindLabels).map(([value, label]) => ({ value, label }))

function addDamage() {
    attack.value.damages.push({
        damage: '',
        damageType: '',
        additionalDamage: 0,
        ability: null,
        proficient: false,
    })
}

function removeDamage(damage: CharacterAttackDamageRecord) {
    attack.value.damages = attack.value.damages.filter(current => current !== damage)
}
</script>

<template>
    <NCollapseItem class="m-0!" name="attack-item">
        <template #header>
            <div class="min-w-0">
                <h3>{{ attack.name || 'Без названия' }}</h3>
            </div>
        </template>
        <template #header-extra>
            <NButton :aria-label="`Удалить атаку ${attack.name || 'без названия'}`" @click.stop="emit('remove')">
                Удалить
            </NButton>
        </template>
        <div class="flex flex-col">
            <NFormItem label="Название">
                <NInput
                    :value="attack.name"
                    aria-label="Название атаки"
                    @update:value="attack.name = $event.trim()"
                />
            </NFormItem>
            <div class="flex gap-4 w-full">
                <NFormItem class="w-full" label="Тип атаки">
                    <NSelect v-model:value="attack.kind" :options="attackKinds" aria-label="Тип атаки" />
                </NFormItem>
                <NFormItem class="w-full" label="Дистанция">
                    <NInputNumber button-placement="both" :min="0" :value="attack.range" aria-label="Дистанция атаки"
                        @update:value="attack.range = $event ?? 0" />
                </NFormItem>
            </div>
            <NFormItem label="Описание">
                <NInput
                    :value="attack.description"
                    type="textarea"
                    :rows="2"
                    aria-label="Описание атаки"
                    @update:value="attack.description = $event.trim()"
                />
            </NFormItem>
            <section class="flex flex-col gap-3" aria-label="Урон атаки">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h4>Урон</h4>
                    <NButton @click="addDamage">Добавить урон</NButton>
                </div>
                <AttackDamageRow v-for="damage in attack.damages" :key="getEntryKey(damage)"
                    v-model:damage="damage.damage" v-model:damage-type="damage.damageType"
                    v-model:additional-damage="damage.additionalDamage" v-model:ability="damage.ability"
                    v-model:proficient="damage.proficient" @remove="removeDamage(damage)" />
            </section>
        </div>
    </NCollapseItem>
</template>
