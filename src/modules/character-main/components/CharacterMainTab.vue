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
import { backgroundIconFor } from '@/data/backgroundIcons.ts'
import { getRules2024Class, getRules2024Feat, getRules2024Feature } from '@/data/rules2024/index.ts'
import { speciesIconFor } from '@/data/speciesIcons.ts'
import { availableChoicesForProgression } from '@/domain/characterProgression.ts'
import { PROGRESSION_UI_ENABLED } from '@/domain/progressionVisibility.ts'
import type { ChoiceDefinition } from '@/types/rules.ts'

type Emits = {
    'update:saving-throw': [key: AbilityKey, patch: CharacterSavingThrowPatch]
    'update:ability': [key: AbilityKey, value: number]
    'update:skill': [id: string, patch: CharacterSkillPatch]
    'update:feats': [feats: CharacterSheetView['feats']]
    'level-up': []
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
    return feature
        ? (getRules2024Class(feature.classId)?.label ?? feature.source)
        : 'Неизвестный источник'
}
function characterSpeciesIcon(character: CharacterSheetView) {
    return speciesIconFor(character.creation?.speciesId ?? character.race.name)
}
function characterBackgroundIcon(character: CharacterSheetView) {
    return backgroundIconFor(
        character.creation?.backgroundId ??
        character.origin.background ??
        character.background.name,
    )
}
function hideBrokenAsset(event: Event) {
    const image = event.currentTarget as HTMLImageElement | null
    if (image) {
        image.hidden = true
        image.parentElement
            ?.querySelector<HTMLElement>('[data-asset-fallback]')
            ?.removeAttribute('hidden')
    }
}
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
        character.ruleset,
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
    <div class="c-tab-content">
        <section class="origin-summary" aria-labelledby="origin-summary-title">
            <div class="c-section-heading c-section-heading-stack">
                <div>
                    <h2 id="origin-summary-title">Происхождение</h2>
                </div>
            </div>
            <div class="origin-summary-grid">
                <div class="origin-species-entry">
                    <span class="c-field-caption">Вид</span><strong class="origin-species-value"><span
                            class="species-summary-icon" aria-hidden="true"><span data-asset-fallback
                                :hidden="Boolean(characterSpeciesIcon(character))">{{
                                    (character.origin.species || character.race.name || '✦').slice(
                                        0,
                                        1,
                                    )
                                }}</span><img v-if="characterSpeciesIcon(character)"
                                :src="characterSpeciesIcon(character)"
                                :alt="`Иконка вида «${character.origin.species || character.race.name}»`"
                                @error="hideBrokenAsset" /></span><span>{{
                                    character.origin.species || character.race.name || 'Не указан'
                                }}</span></strong>
                </div>
                <div>
                    <span class="c-field-caption">Предыстория</span><strong class="origin-background-value"><span
                            class="background-summary-icon" aria-hidden="true"><span data-asset-fallback
                                :hidden="Boolean(characterBackgroundIcon(character))">{{
                                    (
                                        character.origin.background ||
                                        character.background.name ||
                                        '✦'
                                    ).slice(0, 1)
                                }}</span><img v-if="characterBackgroundIcon(character)"
                                :src="characterBackgroundIcon(character)"
                                :alt="`Иконка предыстории «${character.origin.background || character.background.name}»`"
                                @error="hideBrokenAsset" /></span><span>{{
                                    character.origin.background || character.background.name || 'Не указана'
                                }}</span></strong>
                </div>
                <div>
                    <span class="c-field-caption">Происхожденческая черта</span><strong>{{ character.origin.originFeat
                        || 'Не выбрана' }}</strong><small v-if="originFeatDetails(character)">{{
                            originFeatDetails(character)?.description
                        }}</small>
                </div>
                <div>
                    <span class="c-field-caption">Языки</span><strong>{{ character.origin.languages.join(', ') ||
                        'Неуказаны' }}</strong>
                </div>
                <div>
                    <span class="c-field-caption">Инструменты</span><strong>{{ character.origin.tools.join(', ') ||
                        'Неуказаны' }}</strong>
                </div>
            </div>
        </section>
        <div class="main-sheet-grid">
            <AbilityFields
                :abilities="character.abilities"
                :saving-throws="character.savingThrows"
                :level="character.level"
                :disabled="disabled"
                @update="updateAbility"
                @update:saving-throw="updateSavingThrow"
            />
            <SkillFields :skills="character.skills" :abilities="character.abilities" :level="character.level"
                :class-skill-ids="character.creation?.classSkillIds ?? []"
                :race-skill-ids="character.creation?.raceSkillIds ?? []" :background-skill-ids="character.creation?.backgroundSkillIds ??
                    character.background.skillProficiencies
                    " :disabled="disabled" @update="updateSkill" />
        </div>
        <section v-if="PROGRESSION_UI_ENABLED && character.progression?.classLevels?.length"
            class="progression-summary" aria-labelledby="progression-summary-title">
            <div class="c-section-heading c-section-heading-stack">
                <div>
                    <h2 id="progression-summary-title">Прогрессия</h2>
                    <p class="c-section-note">
                        Текущий уровень {{ character.level }} из 20. Повышение добавляет только
                        следующий уровень в черновик.
                    </p>
                </div>
                <NButton v-if="canLevelUp(character)" type="default" :disabled="disabled" @click="emit('level-up')">
                    Повысить до {{ character.level + 1 }}</NButton>
                <span v-else-if="character.level >= 20" class="c-mode-tag">Максимальный уровень</span>
                <span v-else class="c-mode-tag mode-unset">Нужен выбранный класс</span>
            </div>
            <div v-if="lastProgressionHistory(character)" class="progression-history" aria-live="polite">
                <strong>Последнее повышение: {{ lastProgressionHistory(character)?.fromLevel }} →
                    {{ lastProgressionHistory(character)?.toLevel }}</strong>
                <span v-if="lastProgressionHistory(character)?.gainedFeatures.length">Новые особенности добавлены в
                    список ниже.</span>
                <span v-else>На этом уровне особенностей класса не добавлено.</span>
            </div>
            <div v-if="nextProgressionChoices(character).length" class="progression-choices"
                aria-labelledby="progression-choices-title">
                <h3 id="progression-choices-title">
                    Доступные выборы на уровне {{ character.level + 1 }}
                </h3>
                <article v-for="choice in nextProgressionChoices(character)" :key="choice.id"
                    class="c-progression-choice-card">
                    <strong>{{ choice.name }}</strong>
                    <small>Источник: {{ choiceSource(choice) }}</small>
                    <p>Варианты: {{ choice.options.map(choiceOptionLabel).join(', ') }}</p>
                    <p class="c-progression-choice-warning">
                        Информационное описание: текущая модель не поддерживает безопасное
                        сохранение выбора, поэтому он не применяется автоматически.
                    </p>
                </article>
            </div>
        </section>
        <section v-if="character.creation || character.features?.length" class="feature-summary">
            <h2>Особенности героя</h2>
            <div class="feature-summary-grid">
                <div v-if="character.creation">
                    <h3>{{ character.race.name || 'Раса' }}</h3>
                    <ul class="feature-list">
                        <li v-for="feature in character.creation.raceFeatures" :key="feature">
                            {{ feature }}
                        </li>
                    </ul>
                </div>
                <div>
                    <h3>{{ character.class || 'Класс' }}</h3>
                    <div v-if="character.features?.length" class="feature-reference-list">
                        <article v-for="featureId in character.features" :key="featureId"
                            class="c-feature-reference-card">
                            <h4>{{ progressionFeatureName(featureId) }}</h4>
                            <p v-if="progressionFeature(featureId)">
                                {{ progressionFeature(featureId)?.description }}
                            </p>
                            <small v-if="progressionFeature(featureId)">Источник: {{ progressionFeatureSource(featureId)
                            }} · Получено на
                                {{ progressionFeature(featureId)?.level }} уровне</small>
                        </article>
                    </div>
                    <ul v-else class="feature-list">
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

<style scoped>
.feature-list {
    display: grid;
    gap: 6px;
    margin: 0;
    padding-left: 19px;
    color: var(--sheet-ink);
    font-size: 0.88rem;
    line-height: 1.45;
}

.feature-summary-grid .feature-list {
    list-style: none;
    gap: 8px;
    padding-left: 0;
}

.feature-summary-grid .feature-list li {
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 8px;
    background: rgba(255, 248, 231, 0.72);
}

.feature-summary {
    margin-top: 18px;
}

.progression-summary {
    margin-top: 18px;
}

.progression-history {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    margin-top: 14px;
    color: var(--sheet-muted);
    font-size: 0.8rem;
    line-height: 1.4;
}

.progression-history strong {
    color: var(--sheet-ink);
}

.progression-summary .c-section-heading {
    flex-wrap: wrap;
}

.progression-choices {
    display: grid;
    gap: 10px;
    margin-top: 16px;
}

.progression-choices h3 {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1rem;
}

.origin-summary {
    margin-top: 18px;
}

.origin-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
}

.origin-summary-grid>div {
    display: grid;
    gap: 4px;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 10px;
    background: rgba(255, 248, 233, 0.6);
}

.origin-summary-grid strong {
    overflow-wrap: anywhere;
    font-size: 0.88rem;
    line-height: 1.35;
}

.origin-species-value {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.species-summary-icon {
    display: inline-grid;
    place-items: center;
    position: relative;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    overflow: hidden;
    border: 1px solid #c4a474;
    border-radius: 50%;
    background: #f5e5c4;
    color: #704b25;
    font-family: var(--font-serif);
    font-size: 0.9rem;
    font-weight: 800;
}

.species-summary-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}

.origin-background-value {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.background-summary-icon {
    display: inline-grid;
    place-items: center;
    position: relative;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    overflow: hidden;
    border: 1px solid #c4a474;
    border-radius: 50%;
    background: #f5e5c4;
    color: #704b25;
    font-family: var(--font-serif);
    font-size: 0.9rem;
    font-weight: 800;
}

.background-summary-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}

.feature-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.feature-summary-grid h3 {
    margin: 0 0 8px;
}

.main-sheet-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}

.main-sheet-grid>section {
    height: 100%;
    box-sizing: border-box;
}

.feature-reference-list {
    display: grid;
    gap: 8px;
}
</style>
