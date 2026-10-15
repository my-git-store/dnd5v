<script setup lang="ts">
import { CBtn } from '@/ui/components'
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import SavingThrowFields from './SavingThrowFields.vue'
import type { AbilityKey } from '../types/character'
import type { CharacterSavingThrowPatch, CharacterSheetView, CharacterSkillPatch } from '../types/characterView'
import { backgroundIconFor } from '../data/backgroundIcons.ts'
import { getRules2024Class, getRules2024Feat, getRules2024Feature } from '../data/rules2024/index.ts'
import { speciesIconFor } from '../data/speciesIcons.ts'

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{
  'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
  'update:ability': [key: AbilityKey, value: number]
  'update:skill': [id: string, patch: CharacterSkillPatch]
  'level-up': []
}>()
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
function characterSpeciesIcon(character: CharacterSheetView) {
  return character.ruleset === '2024' ? speciesIconFor(character.creation?.speciesId ?? character.race.name) : undefined
}
function characterBackgroundIcon(character: CharacterSheetView) {
  return character.ruleset === '2024' ? backgroundIconFor(character.creation?.backgroundId ?? character.origin.background ?? character.background.name) : undefined
}
function hideBrokenAsset(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null
  if (image) image.hidden = true
}
function canLevelUp(character: CharacterSheetView) {
  return Boolean(character.progression && character.level < 20 && character.progression.classLevels.length)
}
function lastProgressionHistory(character: CharacterSheetView) {
  const history = character.progression?.history ?? []
  return history.length ? history[history.length - 1] : undefined
}
</script>

<template>
  <div class="tab-content">
    <section v-if="character.ruleset === '2024'" class="sheet-section origin-summary" aria-labelledby="origin-summary-title">
      <div class="section-heading section-heading-stack">
        <div>
          <h2 id="origin-summary-title">Происхождение</h2>
          <p class="section-note">Вид, предыстория и полученные от них владения героя.</p>
        </div>
        <span class="mode-tag mode-ready">D&amp;D 2024</span>
      </div>
      <div class="origin-summary-grid">
        <div class="origin-species-entry"><span class="field-caption">Вид</span><strong class="origin-species-value"><span class="species-summary-icon" aria-hidden="true"><span>{{ (character.origin.species || character.race.name || '✦').slice(0, 1) }}</span><img v-if="characterSpeciesIcon(character)" :src="characterSpeciesIcon(character)" :alt="`Иконка вида «${character.origin.species || character.race.name}»`" @error="hideBrokenAsset" /></span><span>{{ character.origin.species || character.race.name || 'Не указан' }}</span></strong></div>
        <div><span class="field-caption">Предыстория</span><strong class="origin-background-value"><span class="background-summary-icon" aria-hidden="true"><span>{{ (character.origin.background || character.background.name || '✦').slice(0, 1) }}</span><img v-if="characterBackgroundIcon(character)" :src="characterBackgroundIcon(character)" :alt="`Иконка предыстории «${character.origin.background || character.background.name}»`" @error="hideBrokenAsset" /></span><span>{{ character.origin.background || character.background.name || 'Не указана' }}</span></strong></div>
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
    <section v-if="character.progression" class="sheet-section progression-summary" aria-labelledby="progression-summary-title">
      <div class="section-heading section-heading-stack">
        <div>
          <h2 id="progression-summary-title">Прогрессия</h2>
          <p class="section-note">Текущий уровень {{ character.level }} из 20. Повышение добавляет только следующий уровень в черновик.</p>
        </div>
        <CBtn v-if="canLevelUp(character)" color-type="accent" :disabled="disabled" @click="emit('level-up')">Повысить до {{ character.level + 1 }}</CBtn>
        <span v-else-if="character.level >= 20" class="mode-tag">Максимальный уровень</span>
        <span v-else class="mode-tag mode-unset">Нужен выбранный класс</span>
      </div>
      <div v-if="lastProgressionHistory(character)" class="progression-history" aria-live="polite">
        <strong>Последнее повышение: {{ lastProgressionHistory(character)?.fromLevel }} → {{ lastProgressionHistory(character)?.toLevel }}</strong>
        <span v-if="lastProgressionHistory(character)?.gainedFeatures.length">Новые особенности добавлены в список ниже.</span>
        <span v-else>На этом уровне особенностей класса не добавлено.</span>
      </div>
    </section>
    <section v-if="character.creation || character.features?.length" class="sheet-section feature-summary">
      <h2>Особенности героя</h2>
      <div class="feature-summary-grid">
        <div v-if="character.creation"><h3>{{ character.race.name || 'Раса' }}</h3><ul class="feature-list"><li v-for="feature in character.creation.raceFeatures" :key="feature">{{ feature }}</li></ul></div>
        <div><h3>{{ character.class || 'Класс' }}</h3><div v-if="character.features?.length" class="feature-reference-list"><article v-for="featureId in character.features" :key="featureId" class="feature-reference-card"><h4>{{ progressionFeatureName(featureId) }}</h4><p v-if="progressionFeature(featureId)">{{ progressionFeature(featureId)?.description }}</p><small v-if="progressionFeature(featureId)">Источник: {{ progressionFeatureSource(featureId) }} · Получено на {{ progressionFeature(featureId)?.level }} уровне</small></article></div><ul v-else class="feature-list"><li v-for="feature in character.creation?.classFeatures ?? []" :key="feature">{{ feature }}</li></ul></div>
      </div>
    </section>
  </div>
</template>
