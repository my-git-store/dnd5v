<script setup lang="ts">
import CombatStatsFields from './CombatStatsFields.vue'
import AttackList from './AttackList.vue'
import type { CharacterSheetView } from '../types/characterView'

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{
  'update:combat': [combat: CharacterSheetView['combat']]
  'update:attacks': [attacks: CharacterSheetView['attacks']]
}>()
</script>

<template>
  <div class="tab-content combat-tab">
    <section class="sheet-section combat-intro-panel">
      <div class="combat-intro-mark" aria-hidden="true">⚔</div>
      <div>
        <p class="eyebrow">БОЕВАЯ СТРАНИЦА</p>
        <h1>Бой</h1>
        <p class="section-note">Класс брони, здоровье и атаки героя — всё, что нужно держать под рукой во время сражения.</p>
      </div>
    </section>
    <CombatStatsFields :combat="character.combat" :abilities="character.abilities" :disabled="disabled" @update="emit('update:combat', $event)" />
    <AttackList :attacks="character.attacks" :abilities="character.abilities" :level="character.level" :disabled="disabled" @update="emit('update:attacks', $event)" />
  </div>
</template>
