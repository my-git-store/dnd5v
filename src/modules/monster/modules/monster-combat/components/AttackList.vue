<script setup lang="ts">
import { NButton, NCollapse } from 'naive-ui'

import { useMonsterSheet } from '../../../composables/useMonsterSheet'
import type { MonsterAttackRecord } from '../../../types/monster'
import { getEntryKey } from '../../../utils/getEntryKey'
import AttackListItem from './AttackListItem.vue'

const { monster } = useMonsterSheet()

function removeAttack(attack: MonsterAttackRecord) {
    if (!monster.value) return
    monster.value.attacks = monster.value.attacks.filter(current => current !== attack)
}

function add() {
    if (!monster.value) return
    monster.value.attacks.push({
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
    <section v-if="monster" aria-label="Атаки">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h3 class="font-semibold">Атаки</h3>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <NCollapse v-for="attack in monster.attacks" :key="getEntryKey(attack)" class="py-3">
            <AttackListItem
                :attack="attack"
                @update:attack="Object.assign(attack, $event)"
                @remove="removeAttack(attack)"
            />
        </NCollapse>
    </section>
</template>
