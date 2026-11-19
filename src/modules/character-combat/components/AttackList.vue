<script setup lang="ts">
import { NButton, NCollapse } from 'naive-ui'

import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterAttackRecord } from '@/types/character'
import { getEntryKey } from '@/utils/getEntryKey'
import AttackListItem from './AttackListItem.vue'

const { character } = useCharacterSheet()

function removeAttack(attack: CharacterAttackRecord) {
    if (!character.value) return
    character.value.attacks = character.value.attacks.filter(current => current !== attack)
}

function add() {
    if (!character.value) return
    character.value.attacks.push({
        name: '',
        kind: 'other',
        damages: [
            { damage: '', damageType: '', additionalDamage: 0, ability: null, proficient: false },
        ],
        range: 0,
        description: '',
    })
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3>Атаки</h3>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <NCollapse v-for="attack in character.attacks" :key="getEntryKey(attack)" class="py-3">
            <AttackListItem :attack="attack" @update:attack="Object.assign(attack, $event)"
                @remove="removeAttack(attack)" />
        </NCollapse>
    </section>
</template>
