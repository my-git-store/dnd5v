<script setup lang="ts">
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import CharacterFeatList from './CharacterFeatList.vue'
import type { AbilityKey } from '@/types/character'
import type {
    CharacterSavingThrowPatch,
    CharacterSheetView,
    CharacterSkillPatch,
} from '@/types/characterView'
import { getRules2024Class, getRules2024Feature } from '@/data/rules2024/index.ts'

type Emits = {
    'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
    'update:ability': [key: AbilityKey, value: number]
    'update:skill': [id: string, patch: CharacterSkillPatch]
    'update:feats': [feats: CharacterSheetView['feats']]
}

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()

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
                :level="character.level" :disabled="disabled" @update="updateAbility"
                @update:saving-throw="updateSavingThrow" />
            <SkillFields :skills="character.skills" :abilities="character.abilities" :level="character.level"
                :class-skill-ids="character.creation?.classSkillIds ?? []"
                :race-skill-ids="character.creation?.raceSkillIds ?? []" :background-skill-ids="character.creation?.backgroundSkillIds ??
                    character.background.skillProficiencies
                    " :disabled="disabled" @update="updateSkill" />
        </div>
        <section v-if="character.creation || character.features?.length">
            <h2>Особенности героя</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-if="character.creation">
                    <h3>{{ character.race.name || 'Раса' }}</h3>
                    <ul>
                        <li v-for="feature in character.creation.raceFeatures" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
                <div>
                    <h3>{{ character.class || 'Класс' }}</h3>
                    <div v-if="character.features?.length" class="grid gap-2">
                        <article v-for="featureId in character.features" :key="featureId">
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
                        <li v-for="feature in character.creation?.classFeatures ?? []" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
            </div>
        </section>
        <CharacterFeatList :feats="character.feats" :disabled="disabled" @update="emit('update:feats', $event)" />
    </div>
</template>
