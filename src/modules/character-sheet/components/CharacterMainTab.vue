<script setup lang="ts">
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import SavingThrowFields from './SavingThrowFields.vue'
import IdentityFields from './IdentityFields.vue'
import type { AbilityKey } from '../types/character'
import type { CharacterIdentityPatch, CharacterSavingThrowPatch, CharacterSheetView, CharacterSkillPatch } from '../types/characterView'

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{
  'update:identity': [patch: CharacterIdentityPatch]
  'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
  'update:ability': [key: AbilityKey, value: number]
  'update:skill': [id: string, patch: CharacterSkillPatch]
}>()
function updateIdentity(patch: CharacterIdentityPatch) { emit('update:identity', patch) }
function updateSavingThrow(key: AbilityKey, patch: CharacterSavingThrowPatch) { emit('update:saving-throw', key, patch) }
function updateAbility(key: AbilityKey, value: number) { emit('update:ability', key, value) }
function updateSkill(id: string, patch: CharacterSkillPatch) { emit('update:skill', id, patch) }
</script>

<template>
  <div class="tab-content">
    <IdentityFields :character="character" :disabled="disabled" @update="updateIdentity" />
    <div class="main-sheet-grid">
      <AbilityFields :abilities="character.abilities" :disabled="disabled" @update="updateAbility" />
      <SavingThrowFields :abilities="character.abilities" :saving-throws="character.savingThrows" :level="character.level" :disabled="disabled" @update="updateSavingThrow" />
      <SkillFields :skills="character.skills" :abilities="character.abilities" :level="character.level" :class-skill-ids="character.creation?.classSkillIds ?? []" :race-skill-ids="character.creation?.raceSkillIds ?? []" :background-skill-ids="character.creation?.backgroundSkillIds ?? character.background.skillProficiencies" :disabled="disabled" @update="updateSkill" />
    </div>
    <section v-if="character.creation" class="sheet-section feature-summary">
      <h2>Особенности героя</h2>
      <div class="feature-summary-grid">
        <div><h3>{{ character.race.name || 'Раса' }}</h3><ul class="feature-list"><li v-for="feature in character.creation.raceFeatures" :key="feature">{{ feature }}</li></ul></div>
        <div><h3>{{ character.class || 'Класс' }}</h3><ul class="feature-list"><li v-for="feature in character.creation.classFeatures" :key="feature">{{ feature }}</li></ul></div>
      </div>
    </section>
  </div>
</template>
