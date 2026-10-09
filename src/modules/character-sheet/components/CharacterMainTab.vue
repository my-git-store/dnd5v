<script setup lang="ts">
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import SavingThrowFields from './SavingThrowFields.vue'
import IdentityFields from './IdentityFields.vue'
import type { AbilityKey } from '../types/character'
import type { CharacterIdentityPatch, CharacterSavingThrowPatch, CharacterSheetView, CharacterSkillPatch } from '../types/characterView'
import { getRules2024Class, getRules2024Feat, getRules2024Feature } from '../data/rules2024/index.ts'

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
function originFeatDetails(character: CharacterSheetView) {
  return character.origin.featId ? getRules2024Feat(character.origin.featId) : undefined
}
function progressionFeatureName(id: string) {
  return getRules2024Feature(id)?.name ?? id
}
function progressionFeature(id: string) {
  return getRules2024Feature(id)
}
function progressionFeatureSource(id: string) {
  const feature = getRules2024Feature(id)
  return feature ? getRules2024Class(feature.classId)?.label ?? feature.source : 'Неизвестный источник'
}
</script>

<template>
  <div class="tab-content">
    <IdentityFields :character="character" :disabled="disabled" @update="updateIdentity" />
    <section v-if="character.ruleset === '2024'" class="sheet-section origin-summary" aria-labelledby="origin-summary-title">
      <div class="section-heading section-heading-stack">
        <div>
          <h2 id="origin-summary-title">Происхождение</h2>
          <p class="section-note">Вид, предыстория и полученные от них владения героя.</p>
        </div>
        <span class="mode-tag mode-ready">D&amp;D 2024</span>
      </div>
      <div class="origin-summary-grid">
        <div><span class="field-caption">Вид</span><strong>{{ character.origin.species || character.race.name || 'Не указан' }}</strong></div>
        <div><span class="field-caption">Предыстория</span><strong>{{ character.origin.background || character.background.name || 'Не указана' }}</strong></div>
        <div><span class="field-caption">Происхожденческая черта</span><strong>{{ character.origin.originFeat || 'Не выбрана' }}</strong><small v-if="originFeatDetails(character)">{{ originFeatDetails(character)?.description }}</small></div>
        <div><span class="field-caption">Языки</span><strong>{{ character.origin.languages.join(', ') || 'Не указаны' }}</strong></div>
        <div><span class="field-caption">Инструменты</span><strong>{{ character.origin.tools.join(', ') || 'Не указаны' }}</strong></div>
      </div>
    </section>
    <div class="main-sheet-grid">
      <AbilityFields :abilities="character.abilities" :disabled="disabled" @update="updateAbility" />
      <SavingThrowFields :abilities="character.abilities" :saving-throws="character.savingThrows" :level="character.level" :disabled="disabled" @update="updateSavingThrow" />
      <SkillFields :skills="character.skills" :abilities="character.abilities" :level="character.level" :class-skill-ids="character.creation?.classSkillIds ?? []" :race-skill-ids="character.creation?.raceSkillIds ?? []" :background-skill-ids="character.creation?.backgroundSkillIds ?? character.background.skillProficiencies" :disabled="disabled" @update="updateSkill" />
    </div>
    <section v-if="character.creation || character.features?.length" class="sheet-section feature-summary">
      <h2>Особенности героя</h2>
      <div class="feature-summary-grid">
        <div v-if="character.creation"><h3>{{ character.race.name || 'Раса' }}</h3><ul class="feature-list"><li v-for="feature in character.creation.raceFeatures" :key="feature">{{ feature }}</li></ul></div>
        <div><h3>{{ character.class || 'Класс' }}</h3><div v-if="character.features?.length" class="feature-reference-list"><article v-for="featureId in character.features" :key="featureId" class="feature-reference-card"><h4>{{ progressionFeatureName(featureId) }}</h4><p v-if="progressionFeature(featureId)">{{ progressionFeature(featureId)?.description }}</p><small v-if="progressionFeature(featureId)">Источник: {{ progressionFeatureSource(featureId) }} · Получено на {{ progressionFeature(featureId)?.level }} уровне</small></article></div><ul v-else class="feature-list"><li v-for="feature in character.creation?.classFeatures ?? []" :key="feature">{{ feature }}</li></ul></div>
      </div>
    </section>
  </div>
</template>
