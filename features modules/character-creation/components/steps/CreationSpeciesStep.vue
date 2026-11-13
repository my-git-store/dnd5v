<script setup lang="ts">
import { toRefs } from 'vue'

import { speciesIconFor } from '../../data/speciesIcons'

import { hideBrokenAsset, choiceOptions } from '../../utils/creationLabels'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            'raceOptions' | 'raceId' | 'selected2024Species' | 'speciesChoices'
        >
    >
    disabled?: boolean
}
type Emits = {
    selectRace: [id: string]
    selectSpeciesChoice: [choiceId: string, choice: string | null]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { raceOptions, raceId, selected2024Species, speciesChoices } = toRefs(props.model)
</script>

<template>
    <div class="grid gap-4">
        <p>Бонусы характеристик задаются исходными значениями.</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Выберите вид">
            <NButton
                v-for="race in raceOptions"
                :key="race.id"
                :type="raceId === race.id ? 'primary' : 'default'"
                native-type="button"
                class="h-auto! whitespace-normal!"
                :aria-pressed="raceId === race.id"
                :disabled="disabled"
                @click="emit('selectRace', race.id)"
            >
                <span class="flex w-full items-center justify-between gap-2"
                    ><span
                        class="inline-flex size-24 shrink-0 items-center justify-center"
                        aria-hidden="true"
                        ><span data-asset-fallback :hidden="Boolean(speciesIconFor(race.id))">{{
                            race.label.slice(0, 1)
                        }}</span
                        ><img
                            v-if="speciesIconFor(race.id)"
                            :src="speciesIconFor(race.id)"
                            :alt="`Иконка вида «${race.label}»`"
                            loading="lazy"
                            @error="hideBrokenAsset" /></span
                    ><span v-if="raceId === race.id" aria-label="Выбрано">✓</span></span
                >
                <strong>{{ race.label }}</strong
                ><span>{{ race.profile.size }} · скорость {{ race.profile.speed }} фт.</span
                ><span v-if="race.id === selected2024Species.id">{{
                    selected2024Species.description
                }}</span>
                <span>Особенности: {{ race.profile.traits.join(' · ') }}</span>
                <span v-if="race.id === selected2024Species.id"
                    >Языки: {{ selected2024Species.languages.join(', ') || 'не указаны' }}</span
                >
            </NButton>
        </div>
        <div v-if="selected2024Species.choices.length">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p>Наследие вида</p>
                    <h3>Выберите особенность</h3>
                    <p>
                        Выбор сохраняется как источник «Вид»; правила будут подключены отдельным
                        слоем правил.
                    </p>
                </div>
                <span aria-hidden="true">✧</span>
            </div>
            <div v-for="choice in selected2024Species.choices" :key="choice.id">
                <div>
                    <strong>{{ choice.label }}</strong>
                    <p>{{ choice.description }}</p>
                </div>
                <label class="grid gap-2"
                    ><span class="sr-only">{{ choice.label }}</span
                    ><NSelect
                        class="w-full"
                        :value="speciesChoices[choice.id]?.[0] ?? ''"
                        :options="choiceOptions(choice.options)"
                        :disabled="disabled"
                        @update:value="emit('selectSpeciesChoice', choice.id, $event)"
                /></label>
            </div>
        </div>
    </div>
</template>
