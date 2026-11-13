<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    availableChoicesForProgression,
    levelUpProgression,
} from '../domain/characterProgression'
import { getRules2024Feature } from '@/data/rules2024/index.ts'
import type { CharacterSheetView } from '@/types/characterView.ts'
import type {
    CharacterProgression,
    ChoiceDefinition,
    ProgressionFeatureGain,
} from '@/types/rules.ts'

export type Props = {
    character: CharacterSheetView
    disabled?: boolean
    onConfirm: () => void
}

type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const confirming = ref(false)

const confirmError = ref<string | null>(null)

const nextLevel = computed(() => props.character.level + 1)

const sourceProgression = computed(() => props.character.progression)

function cloneProgression(value: CharacterProgression): CharacterProgression {
    return {
        ...value,
        classLevels: value.classLevels.map(entry => ({ ...entry })),
        features: [...value.features],
        choices: Object.fromEntries(
            Object.entries(value.choices).map(([key, options]) => [key, [...options]]),
        ),
        gainedFeatures: value.gainedFeatures?.map(gain => ({
            ...gain,
            source: { ...gain.source },
        })),
        history: value.history?.map(entry => ({
            ...entry,
            gainedFeatures: entry.gainedFeatures.map(gain => ({
                ...gain,
                source: { ...gain.source },
            })),
            choices: Object.fromEntries(
                Object.entries(entry.choices).map(([key, options]) => [key, [...options]]),
            ),
        })),
        choiceMetadata: value.choiceMetadata
            ? {
                  abilityScoreImprovementLevels: [
                      ...value.choiceMetadata.abilityScoreImprovementLevels,
                  ],
                  featChoiceLevels: [...value.choiceMetadata.featChoiceLevels],
              }
            : undefined,
    }
}

const previewProgression = computed(() => {
    if (
        !sourceProgression.value ||
        props.character.level >= 20 ||
        !sourceProgression.value.classLevels.length
    )
        return undefined
    try {
        return levelUpProgression(
            cloneProgression(sourceProgression.value),
            nextLevel.value,
        )
    } catch {
        return undefined
    }
})

const previewFeatures = computed(() => {
    const history = previewProgression.value?.history ?? []
    return history.length ? (history[history.length - 1]?.gainedFeatures ?? []) : []
})

const previewChoices = computed(() =>
    sourceProgression.value
        ? availableChoicesForProgression(
              sourceProgression.value,
              nextLevel.value,
          )
        : [],
)

function featureDefinition(gain: ProgressionFeatureGain) {
    return getRules2024Feature(gain.featureId)
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

function cancel() {
    if (confirming.value) return
    emit('close')
}

function confirmLevelUp() {
    if (confirming.value || props.disabled || !previewProgression.value) return
    confirming.value = true
    confirmError.value = null
    try {
        props.onConfirm()
        emit('close')
    } catch (error) {
        confirming.value = false
        confirmError.value = error instanceof Error ? error.message : 'Не удалось повысить уровень.'
    }
}
</script>

<template>
    <NModal
        :show="true"
        class="w-full max-w-3xl max-h-[90vh] overflow-auto"
        :mask-closable="!confirming"
        :on-close="cancel"
    >
        <NCard class="w-full">
            <template #header>Подтверждение повышения уровня</template>
            <p>Уровень {{ character.level }} → {{ nextLevel }}</p>
            <p>
                Изменение попадёт в черновик. Для окончательного сохранения нажмите общую кнопку
                «Сохранить».
            </p>

            <section aria-labelledby="level-up-features-title">
                <h3 id="level-up-features-title">Особенности нового уровня</h3>
                <div v-if="previewFeatures.length">
                    <article v-for="gain in previewFeatures" :key="gain.featureId">
                        <h4>{{ featureDefinition(gain)?.name ?? gain.featureId }}</h4>
                        <p>
                            {{
                                featureDefinition(gain)?.description ??
                                'Описание особенности отсутствует в текущем каталоге.'
                            }}
                        </p>
                        <small
                            >Источник: {{ gain.source.label ?? gain.source.id }} · Уровень
                            {{ gain.level }}</small
                        >
                    </article>
                </div>
                <p v-else>На этом уровне новых особенностей в текущем каталоге нет.</p>
            </section>

            <section v-if="previewChoices.length" aria-labelledby="level-up-choices-title">
                <h3 id="level-up-choices-title">Доступные выборы</h3>
                <article v-for="choice in previewChoices" :key="choice.id">
                    <strong>{{ choice.name }}</strong>
                    <small>Источник: {{ choiceSource(choice) }}</small>
                    <p>Варианты: {{ choice.options.map(choiceOptionLabel).join(', ') }}</p>
                    <p>
                        Выбор пока не применяется: текущая модель хранит только метаданные и не
                        поддерживает безопасное сохранение этого выбора.
                    </p>
                </article>
            </section>

            <p v-if="confirmError" role="alert">{{ confirmError }}</p>
            <div class="flex flex-wrap items-center gap-2">
                <NButton :disabled="confirming" @click="cancel">Отмена</NButton>
                <NButton
                    type="primary"
                    :disabled="confirming || disabled || !previewProgression"
                    @click="confirmLevelUp"
                    >Подтвердить повышение</NButton
                >
            </div>
        </NCard>
    </NModal>
</template>
