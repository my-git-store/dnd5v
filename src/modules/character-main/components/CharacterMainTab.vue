<script setup lang="ts">
import { computed } from 'vue'
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import CharacterFeatList from './CharacterFeatList.vue'
import type { AbilityKey } from '@/types/character'
import type {
    CharacterSavingThrowPatch,
    Character,
    CharacterSkillPatch,
} from '@/types/character'
import { getRules2024Class, getRules2024Feature } from '@/data/rules2024/index.ts'

type Emits = {
    'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
    'update:ability': [key: AbilityKey, value: number]
    'update:skill': [id: string, patch: CharacterSkillPatch]
    'update:feats': [feats: NonNullable<Character['feats']>]
}

const props = defineProps<{ character: Character; disabled?: boolean }>()

const featureIds = computed(() => props.character.features ?? props.character.progression?.features ?? [])

const emit = defineEmits<Emits>()

function updateSavingThrow(key: AbilityKey, patch: CharacterSavingThrowPatch) {
    emit('update:saving-throw', key, patch)
}
function updateAbility(key: AbilityKey, value: number) {
    emit('update:ability', key, value)
}
function updateSkill(id: string, patch: CharacterSkillPatch) {
    emit('update:skill', id, patch)
}
function progressionFeatureName(id: string) {
    return getRules2024Feature(id)?.name ?? id
}
function progressionFeature(id: string) {
    return getRules2024Feature(id)
}
function progressionFeatureSource(id: string) {
    const feature = getRules2024Feature(id)
    return feature
        ? (getRules2024Class(feature.classId)?.label ?? feature.source)
        : 'Неизвестный источник'
}
</script>

<template>
    <div class="grid gap-4">
        <div class="grid gap-4">
            <AbilityFields :abilities="character.abilities" :saving-throws="character.savingThrows"
                :level="character.identity.level" :disabled="disabled" @update="updateAbility"
                @update:saving-throw="updateSavingThrow" />
            <SkillFields :skills="character.skills" :abilities="character.abilities" :level="character.identity.level"
                :class-skill-ids="character.extensions.characterCreation?.classSkillIds ?? []"
                :race-skill-ids="[
                    ...(character.extensions.characterCreation?.raceSkillIds ?? []),
                    ...(character.extensions.characterCreation?.subraceSkillIds ?? []),
                ]" :background-skill-ids="[
                    ...(character.extensions.characterCreation?.backgroundSkillIds ?? []),
                    ...character.identity.background.skillProficiencies,
                ]" :disabled="disabled" @update="updateSkill" />
        </div>
        <section v-if="character.extensions.characterCreation || featureIds.length">
            <h2>Особенности героя</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-if="character.extensions.characterCreation">
                    <h3>{{ character.identity.race.name || 'Раса' }}</h3>
                    <ul>
                        <li v-for="feature in character.extensions.characterCreation.raceFeatures" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
                <div>
                    <h3>{{ character.identity.class || 'Класс' }}</h3>
                    <div v-if="featureIds.length" class="grid gap-2">
                        <article v-for="featureId in featureIds" :key="featureId">
                            <h4>{{ progressionFeatureName(featureId) }}</h4>
                            <p v-if="progressionFeature(featureId)">
                                {{ progressionFeature(featureId)?.description }}
                            </p>
                            <small v-if="progressionFeature(featureId)">Источник: {{ progressionFeatureSource(featureId)
                            }} · Получено на
                                {{ progressionFeature(featureId)?.level }} уровне</small>
                        </article>
                    </div>
                    <ul v-else>
                        <li v-for="feature in character.extensions.characterCreation?.classFeatures ?? []" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
            </div>
        </section>
        <CharacterFeatList :feats="character.feats ?? []" :disabled="disabled" @update="emit('update:feats', $event)" />
    </div>
</template>
