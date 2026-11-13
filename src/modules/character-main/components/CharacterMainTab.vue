<script setup lang="ts">
import { computed } from 'vue'
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import CharacterFeatList from '@/modules/character-feats/components/CharacterFeatList.vue'
import type {
    AbilityKey,
    Character,
    CharacterFeat,
    CharacterSavingThrowPatch,
    CharacterSkillPatch,
} from '@/types/character'
import { getRules2024Class, getRules2024Feature } from '@/data/rules2024/index.ts'

type Emits = {
    'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
    'update:ability': [key: AbilityKey, value: number]
    'update:skill': [id: string, patch: CharacterSkillPatch]
    'update:feats': [feats: CharacterFeat[]]
}

const props = defineProps<{ character: Character; disabled?: boolean }>()

const emit = defineEmits<Emits>()

const characterCreation = computed(() => props.character.extensions.characterCreation)

const raceSkillIds = computed(() => [
    ...(characterCreation.value?.raceSkillIds ?? []),
    ...(characterCreation.value?.subraceSkillIds ?? []),
])

const backgroundSkillIds = computed(() => [
    ...(characterCreation.value?.backgroundSkillIds ?? []),
    ...props.character.identity.background.skillProficiencies,
])

const progressionFeatures = computed(() => {
    const featureIds = props.character.features ?? props.character.progression?.features ?? []

    return featureIds.map(id => {
        const feature = getRules2024Feature(id)

        return {
            id,
            feature,
            source: feature ? (getRules2024Class(feature.classId)?.label ?? feature.source) : '',
        }
    })
})

function updateSavingThrow(key: AbilityKey, patch: CharacterSavingThrowPatch) {
    emit('update:saving-throw', key, patch)
}
function updateAbility(key: AbilityKey, value: number) {
    emit('update:ability', key, value)
}
function updateSkill(id: string, patch: CharacterSkillPatch) {
    emit('update:skill', id, patch)
}
</script>

<template>
    <div class="grid gap-4">
        <AbilityFields
            :abilities="character.abilities"
            :saving-throws="character.savingThrows"
            :level="character.identity.level"
            :disabled="disabled"
            @update="updateAbility"
            @update:saving-throw="updateSavingThrow"
        />
        <SkillFields
            :skills="character.skills"
            :abilities="character.abilities"
            :level="character.identity.level"
            :class-skill-ids="characterCreation?.classSkillIds"
            :race-skill-ids="raceSkillIds"
            :background-skill-ids="backgroundSkillIds"
            :disabled="disabled"
            @update="updateSkill"
        />
        <section v-if="characterCreation || progressionFeatures.length">
            <h2>Особенности героя</h2>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-if="characterCreation">
                    <h3>{{ character.identity.race.name || 'Раса' }}</h3>
                    <ul>
                        <li v-for="feature in characterCreation.raceFeatures" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
                <div>
                    <h3>{{ character.identity.class || 'Класс' }}</h3>
                    <div v-if="progressionFeatures.length" class="grid gap-2">
                        <article v-for="{ id, feature, source } in progressionFeatures" :key="id">
                            <h4>{{ feature?.name ?? id }}</h4>
                            <template v-if="feature">
                                <p>{{ feature.description }}</p>
                                <small>Источник: {{ source }} · Получено на {{ feature.level }} уровне</small>
                            </template>
                        </article>
                    </div>
                    <ul v-else>
                        <li v-for="feature in characterCreation?.classFeatures" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
            </div>
        </section>
        <CharacterFeatList :feats="character.feats ?? []" :disabled="disabled" @update="emit('update:feats', $event)" />
    </div>
</template>
