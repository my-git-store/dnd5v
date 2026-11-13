<script setup lang="ts">
import type { CharacterSheetView } from '@/types/characterView'
import type { ChoiceDefinition } from '@/types/rules'
import { availableChoicesForProgression } from '../domain/characterProgression'
import { PROGRESSION_UI_ENABLED } from '../domain/progressionVisibility'

defineProps<{ character: CharacterSheetView; disabled?: boolean }>()

const emit = defineEmits<{ 'level-up': [] }>()

function canLevelUp(character: CharacterSheetView) {
    return Boolean(
        character.progression && character.level < 20 && character.progression.classLevels.length,
    )
}
function lastProgressionHistory(character: CharacterSheetView) {
    const history = character.progression?.history ?? []
    return history.length ? history[history.length - 1] : undefined
}
function nextProgressionChoices(character: CharacterSheetView): ChoiceDefinition[] {
    if (!character.progression || !canLevelUp(character)) return []
    return availableChoicesForProgression(
        character.progression,
        character.level + 1,
    )
}
function choiceOptionLabel(option: string) {
    const labels: Record<string, string> = {
        'ability-score-improvement': 'Улучшение характеристики',
        feat: 'Черта',
    }
    return labels[option] ?? option
}
function choiceSource(choice: ChoiceDefinition) {
    return choice.source.label ?? choice.source.id
}
</script>

<template>
        <section v-if="PROGRESSION_UI_ENABLED && character.progression?.classLevels?.length"
            aria-labelledby="progression-summary-title">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 id="progression-summary-title">Прогрессия</h2>
                    <p>
                        Текущий уровень {{ character.level }} из 20. Повышение добавляет только
                        следующий уровень в черновик.
                    </p>
                </div>
                <NButton v-if="canLevelUp(character)" type="default" :disabled="disabled" @click="emit('level-up')">
                    Повысить до {{ character.level + 1 }}</NButton>
                <span v-else-if="character.level >= 20">Максимальный уровень</span>
                <span v-else>Нужен выбранный класс</span>
            </div>
            <div v-if="lastProgressionHistory(character)" aria-live="polite">
                <strong>Последнее повышение: {{ lastProgressionHistory(character)?.fromLevel }} →
                    {{ lastProgressionHistory(character)?.toLevel }}</strong>
                <span v-if="lastProgressionHistory(character)?.gainedFeatures.length">Новые особенности добавлены в
                    список ниже.</span>
                <span v-else>На этом уровне особенностей класса не добавлено.</span>
            </div>
            <div v-if="nextProgressionChoices(character).length" aria-labelledby="progression-choices-title">
                <h3 id="progression-choices-title">
                    Доступные выборы на уровне {{ character.level + 1 }}
                </h3>
                <article v-for="choice in nextProgressionChoices(character)" :key="choice.id">
                    <strong>{{ choice.name }}</strong>
                    <small>Источник: {{ choiceSource(choice) }}</small>
                    <p>Варианты: {{ choice.options.map(choiceOptionLabel).join(', ') }}</p>
                    <p>
                        Информационное описание: текущая модель не поддерживает безопасное
                        сохранение выбора, поэтому он не применяется автоматически.
                    </p>
                </article>
            </div>
        </section>
</template>
