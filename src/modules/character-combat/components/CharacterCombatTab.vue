<script setup lang="ts">
import CombatStatsFields from './CombatStatsFields.vue'
import AttackList from './AttackList.vue'
import RestActions from './RestActions.vue'
import type { CharacterSheetView } from '@/types/characterView'
import type { ShortRestResult } from '@/domain/rest'

type Emits = {
    'update:combat': [combat: CharacterSheetView['combat']]
    'update:attacks': [attacks: CharacterSheetView['attacks']]
}

defineProps<{
    character: CharacterSheetView
    disabled?: boolean
    onShortRest: (dice: number) => ShortRestResult | null | Promise<ShortRestResult | null>
    onLongRest: () => void | Promise<void>
}>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div class="grid gap-4">
        <section>
            <div aria-hidden="true">⚔</div>
            <div>
                <h1>Бой</h1>
            </div>
        </section>
        <CombatStatsFields
            :combat="character.combat"
            :abilities="character.abilities"
            :disabled="disabled"
            @update="emit('update:combat', $event)"
        />
        <RestActions
            :combat="character.combat"
            :abilities="character.abilities"
            :disabled="disabled"
            :on-short-rest="onShortRest"
            :on-long-rest="onLongRest"
        />
        <AttackList
            :attacks="character.attacks"
            :abilities="character.abilities"
            :level="character.level"
            :disabled="disabled"
            @update="emit('update:attacks', $event)"
        />
    </div>
</template>
