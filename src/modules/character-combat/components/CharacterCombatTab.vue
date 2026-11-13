<script setup lang="ts">
import CombatStatsFields from './CombatStatsFields.vue'
import AttackList from './AttackList.vue'
import { useCharacterCombat } from '../composables/useCharacterCombat'
import type { Character } from '@/types/character'

defineProps<{
    character: Character
    disabled?: boolean
}>()

const { updateCombat, updateAttacks } = useCharacterCombat()
</script>

<template>
    <div class="grid gap-4">
        <CombatStatsFields :combat="character.combat" :abilities="character.abilities" :disabled="disabled"
            @update="updateCombat" />
        <AttackList :attacks="character.attacks" :abilities="character.abilities" :level="character.identity.level"
            :disabled="disabled" @update="updateAttacks" />
    </div>
</template>
