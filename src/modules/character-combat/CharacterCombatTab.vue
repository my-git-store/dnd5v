<script setup lang="ts">
import CombatStatsFields from './components/CombatStatsFields.vue'
import AttackList from './components/AttackList.vue';
import { NCollapse, NCollapseItem } from 'naive-ui';
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import RestActions from './components/RestActions.vue'
import { takeLongRest, takeShortRest, restoreSpellSlots } from '@/domain/rest'

const { character, save } = useCharacterSheet()

function shortRest(dice: number) {
    if (!character.value) return null
    const result = takeShortRest(character.value.combat, character.value.abilities, dice)
    character.value.combat = result.combat
    if (result.spent > 0) save()
    return result
}

function longRest() {
    if (!character.value) return
    character.value.combat = takeLongRest(character.value.combat, character.value.ruleset ?? '2024')
    character.value.spellcasting.spellSlots = restoreSpellSlots(
        character.value.spellcasting.spellSlots,
    )
    save()
}
</script>

<template>
    <div v-if="character" class="flex flex-col gap-4">
        <RestActions
            :combat="character.combat"
            :abilities="character.abilities"
            :on-short-rest="shortRest"
            :on-long-rest="longRest"
        />
        <NCollapse>
        <NCollapseItem name="CombatStatsFields" title="Основное">
            <CombatStatsFields />
        </NCollapseItem>
        <NCollapseItem name="AttackList" title="Атаки">
            <AttackList />
        </NCollapseItem>
        </NCollapse>
    </div>
</template>
