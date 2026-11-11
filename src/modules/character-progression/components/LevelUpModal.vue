<script setup lang="ts">
import { computed, ref } from 'vue'
import {
    availableChoicesForProgression,
    levelUpProgression,
} from '@/domain/characterProgression.ts'
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
            props.character.ruleset,
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
              props.character.ruleset,
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
    <NModal :show="true" class="level-up-modal" :mask-closable="!confirming" :on-close="cancel">
        <NCard class="c-character-editor-card level-up-modal-card">
            <template #header>Подтверждение повышения уровня</template>
            <p class="level-up-modal-lead">Уровень {{ character.level }} → {{ nextLevel }}</p>
            <p class="level-up-modal-note">
                Изменение попадёт в черновик. Для окончательного сохранения нажмите общую кнопку
                «Сохранить».
            </p>

            <section class="level-up-preview-section" aria-labelledby="level-up-features-title">
                <h3 id="level-up-features-title">Особенности нового уровня</h3>
                <div v-if="previewFeatures.length" class="level-up-feature-list">
                    <article
                        v-for="gain in previewFeatures"
                        :key="gain.featureId"
                        class="c-feature-reference-card"
                    >
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
                <p v-else class="level-up-empty-state">
                    На этом уровне новых особенностей в текущем каталоге нет.
                </p>
            </section>

            <section
                v-if="previewChoices.length"
                class="level-up-preview-section"
                aria-labelledby="level-up-choices-title"
            >
                <h3 id="level-up-choices-title">Доступные выборы</h3>
                <article
                    v-for="choice in previewChoices"
                    :key="choice.id"
                    class="c-progression-choice-card"
                >
                    <strong>{{ choice.name }}</strong>
                    <small>Источник: {{ choiceSource(choice) }}</small>
                    <p>Варианты: {{ choice.options.map(choiceOptionLabel).join(', ') }}</p>
                    <p class="c-progression-choice-warning">
                        Выбор пока не применяется: текущая модель хранит только метаданные и не
                        поддерживает безопасное сохранение этого выбора.
                    </p>
                </article>
            </section>

            <p v-if="confirmError" class="form-error" role="alert">{{ confirmError }}</p>
            <div class="c-character-identity-modal-actions level-up-modal-actions">
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

<style scoped>
.level-up-modal {
    width: min(720px, calc(100vw - 24px));
    max-width: none;
    max-height: calc(100vh - 24px);
    overflow: auto;
}
.level-up-modal-card {
    max-height: none;
}
.level-up-modal-lead {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1.3rem;
}
.level-up-modal-note {
    margin: 8px 0 0;
    color: var(--sheet-muted);
    font-size: 0.85rem;
    line-height: 1.5;
}
.level-up-preview-section {
    display: grid;
    gap: 9px;
    margin-top: 18px;
}
.level-up-preview-section h3 {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1rem;
}
.level-up-feature-list {
    display: grid;
    gap: 8px;
}
.level-up-empty-state {
    margin: 0;
    color: var(--sheet-muted);
    font-size: 0.82rem;
}
.level-up-modal-actions {
    gap: 10px;
}
</style>
