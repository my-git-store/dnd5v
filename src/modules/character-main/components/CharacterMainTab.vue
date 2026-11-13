<script setup lang="ts">
import { computed } from 'vue'
import AbilityFields from './AbilityFields.vue'
import SkillFields from './SkillFields.vue'
import CharacterFeatList from '@/modules/character-feats/components/CharacterFeatList.vue'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { getRules2024Class, getRules2024Feature } from '@/data/rules2024/index.ts'

const { character } = useCharacterSheet()

const characterCreation = computed(() => character.value?.extensions.characterCreation)

const progressionFeatures = computed(() => {
    const featureIds = character.value?.features ?? character.value?.progression?.features ?? []

    return featureIds.map(id => {
        const feature = getRules2024Feature(id)

        return {
            id,
            feature,
            source: feature ? (getRules2024Class(feature.classId)?.label ?? feature.source) : '',
        }
    })
})
</script>

<template>
    <div v-if="character" class="grid gap-4">
        <AbilityFields />
        <SkillFields />
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
        <CharacterFeatList />
    </div>
</template>
