<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import { abilityModifier, signedModifier } from '../domain/abilityModifier'
import { createDefaultNpcProfile } from '../domain/npc'
import NpcEntryEditorModal from './NpcEntryEditorModal.vue'
import type { CharacterSheetView } from '../types/characterView'
import type { CharacterNpcBonus, CharacterNpcEntry, CharacterNpc } from '../types/character'

const props = defineProps<{
    character: CharacterSheetView
    dirty: boolean
    saving: boolean
    saved: boolean
    saveError: string | null
    onSave: () => void | Promise<void>
    onPrint: () => void
}>()

const emit = defineEmits<{ update: [npc: CharacterNpc] }>()

type EntryModalProps = {
    onSave: (entry: CharacterNpcEntry) => void
}

const entryModal = useModalUtil<CharacterNpcEntry, EntryModalProps>()

const draft = ref<CharacterNpc>(
    JSON.parse(
        JSON.stringify(props.character.npc ?? createDefaultNpcProfile(props.character.name)),
    ) as CharacterNpc,
)

const abilityKeys = [
    'strength',
    'dexterity',
    'constitution',
    'intelligence',
    'wisdom',
    'charisma',
] as const

const abilityLabels: Record<(typeof abilityKeys)[number], string> = {
    strength: 'Сила',
    dexterity: 'Ловкость',
    constitution: 'Телосложение',
    intelligence: 'Интеллект',
    wisdom: 'Мудрость',
    charisma: 'Харизма',
}

const armorClassModeOptions = [
    { value: 'manual', label: 'Вручную' },
    { value: 'computed', label: 'Расчёт' },
]

const initiativeModeOptions = [
    { value: 'computed', label: 'Расчёт' },
    { value: 'manual', label: 'Вручную' },
]

const initiative = computed(() =>
    draft.value.initiative.mode === 'manual'
        ? signedModifier(draft.value.initiative.value ?? 0)
        : signedModifier(
            abilityModifier(draft.value.abilities.dexterity) +
            draft.value.initiative.additionalBonus,
        ),
)

function snapshot(value: CharacterNpc | undefined): string {
    return JSON.stringify(value ?? null)
}
watch(
    () => props.character.npc,
    value => {
        if (value && snapshot(value) !== snapshot(draft.value))
            draft.value = JSON.parse(JSON.stringify(value)) as CharacterNpc
    },
    { deep: true },
)
watch(
    draft,
    value => {
        if (snapshot(value) !== snapshot(props.character.npc))
            emit('update', JSON.parse(JSON.stringify(value)) as CharacterNpc)
    },
    { deep: true },
)

function integer(value: unknown, fallback = 0): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : fallback
}
function updateNumber(
    path:
        | 'proficiencyBonus'
        | 'speed'
        | 'armorClass'
        | 'armorBonus'
        | 'hpMax'
        | 'hpCurrent'
        | 'hpTemporary'
        | 'initiativeBonus',
    value: unknown,
) {
    const parsed = integer(value)
    if (path === 'proficiencyBonus') draft.value.proficiencyBonus = parsed
    if (path === 'speed') draft.value.speed = parsed
    if (path === 'armorClass') draft.value.armorClass.value = parsed
    if (path === 'armorBonus') draft.value.armorClass.additionalBonus = parsed
    if (path === 'hpMax') {
        draft.value.hitPoints.max = parsed
        draft.value.hitPoints.current = Math.min(draft.value.hitPoints.current, parsed)
    }
    if (path === 'hpCurrent')
        draft.value.hitPoints.current = Math.min(parsed, draft.value.hitPoints.max)
    if (path === 'hpTemporary') draft.value.hitPoints.temporary = parsed
    if (path === 'initiativeBonus')
        draft.value.initiative.additionalBonus = Number.isFinite(Number(value))
            ? Math.trunc(Number(value))
            : 0
}
function setCalculationMode(target: 'armorClass' | 'initiative', value: string | null) {
    if (value !== 'manual' && value !== 'computed') return
    if (target === 'armorClass') draft.value.armorClass.mode = value
    else draft.value.initiative.mode = value
}
function updateInitiativeValue(value: unknown) {
    const parsed = Number(value)
    draft.value.initiative.value = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}
function updateAbility(key: (typeof abilityKeys)[number], value: unknown) {
    draft.value.abilities[key] = integer(value, 10)
}
function addBonus(kind: 'skills' | 'savingThrows') {
    draft.value[kind].push({ id: `npc-${kind}-${Date.now()}`, name: '', value: 0 })
}
function removeBonus(kind: 'skills' | 'savingThrows', id: string) {
    draft.value[kind] = draft.value[kind].filter(entry => entry.id !== id)
}
function updateBonus(entry: CharacterNpcBonus, value: unknown) {
    entry.value = Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0
}
function saveEntry(kind: 'features' | 'actions', entry: CharacterNpcEntry) {
    const entries = draft.value[kind]

    const index = entries.findIndex(current => current.id === entry.id)
    if (index >= 0) entries[index] = entry
    else entries.push(entry)
}
function openEntry(kind: 'features' | 'actions', entry?: CharacterNpcEntry) {
    const next = entry
        ? { ...entry }
        : {
            id: `npc-${kind}-${Date.now()}`,
            name: '',
            description: '',
            attackBonus: '',
            damage: '',
        }
    entryModal.item.value = next
    entryModal.props.value = { onSave: (value: CharacterNpcEntry) => saveEntry(kind, value) }
    entryModal.openOrClose()
}
function removeEntry(kind: 'features' | 'actions', id: string) {
    draft.value[kind] = draft.value[kind].filter(entry => entry.id !== id)
}
</script>

<template>
    <div class="npc-sheet-panel">
        <header class="npc-sheet-header">
            <div>
                <p class="c-eyebrow">Режим НПС</p>
                <h1>{{ draft.name || 'Новый НПС' }}</h1>
                <p class="c-section-note">
                    Отдельный компактный лист существа без прогрессии персонажа.
                </p>
            </div>
            <div class="npc-sheet-actions">
                <NButton type="default" :disabled="saving" @click="onPrint">Печать НПС</NButton>
                <NButton type="primary" :loading="saving" :disabled="!dirty" @click="onSave">{{
                    saved ? 'Сохранено' : 'Сохранить'
                }}</NButton>
            </div>
        </header>
        <p v-if="saveError" class="c-status-text error" role="alert" aria-live="assertive">
            {{ saveError }}
        </p>
        <p v-else-if="dirty" class="c-status-text warning" role="status" aria-live="polite">
            Есть несохранённые изменения
        </p>
        <p v-else-if="saved" class="c-status-text success" role="status" aria-live="polite">
            Сохранено
        </p>

        <section class="c-sheet-section npc-identity-section" aria-labelledby="npc-identity-title">
            <div class="c-section-heading">
                <h2 id="npc-identity-title">Основные сведения НПС</h2>
                <span class="c-mode-tag mode-ready">НПС</span>
            </div>
            <div class="npc-field-grid">
                <NFormItem label="Имя">
                    <NInput v-model:value="draft.name" />
                </NFormItem>
                <NFormItem label="Тип существа">
                    <NInput v-model:value="draft.creatureType" />
                </NFormItem>
                <NFormItem label="Размер">
                    <NInput v-model:value="draft.size" />
                </NFormItem>
                <NFormItem label="Мировоззрение">
                    <NInput v-model:value="draft.alignment" />
                </NFormItem>
                <NFormItem label="Рейтинг опасности">
                    <NInput v-model:value="draft.challengeRating" />
                </NFormItem>
                <NFormItem label="Бонус мастерства">
                    <NInputNumber min="0" :value="draft.proficiencyBonus"
                        @update:value="updateNumber('proficiencyBonus', $event)" />
                </NFormItem>
                <label class="npc-mode-field"><span>Класс доспеха</span>
                    <NSelect class="c-select-control" :value="draft.armorClass.mode" :options="armorClassModeOptions"
                        aria-label="Режим класса доспеха" @update:value="setCalculationMode('armorClass', $event)" />
                </label>
                <NFormItem label="Значение КД">
                    <NInputNumber min="0" :value="draft.armorClass.value"
                        @update:value="updateNumber('armorClass', $event)" />
                </NFormItem>
                <NFormItem label="Добавка к КД">
                    <NInputNumber min="0" :value="draft.armorClass.additionalBonus"
                        @update:value="updateNumber('armorBonus', $event)" />
                </NFormItem>
                <NFormItem label="Максимум HP">
                    <NInputNumber min="0" :value="draft.hitPoints.max" @update:value="updateNumber('hpMax', $event)" />
                </NFormItem>
                <NFormItem label="Текущие HP">
                    <NInputNumber min="0" :value="draft.hitPoints.current"
                        @update:value="updateNumber('hpCurrent', $event)" />
                </NFormItem>
                <NFormItem label="Временные HP">
                    <NInputNumber min="0" :value="draft.hitPoints.temporary"
                        @update:value="updateNumber('hpTemporary', $event)" />
                </NFormItem>
                <NFormItem label="Скорость">
                    <NInputNumber min="0" :value="draft.speed" @update:value="updateNumber('speed', $event)" />
                </NFormItem>
                <label class="npc-mode-field"><span>Режим инициативы</span>
                    <NSelect class="c-select-control" :value="draft.initiative.mode ?? 'computed'"
                        :options="initiativeModeOptions" aria-label="Режим инициативы"
                        @update:value="setCalculationMode('initiative', $event)" />
                </label>
                <NFormItem v-if="draft.initiative.mode !== 'manual'" label="Добавка к инициативе">
                    <NInputNumber :value="draft.initiative.additionalBonus"
                        @update:value="updateNumber('initiativeBonus', $event)" />
                </NFormItem>
                <NFormItem v-else label="Ручная инициатива">
                    <NInputNumber :value="draft.initiative.value ?? 0" @update:value="updateInitiativeValue($event)" />
                </NFormItem>
                <div class="npc-derived-card">
                    <span>Инициатива</span><strong>{{ initiative }}</strong><small>{{
                        draft.initiative.mode === 'manual'
                            ? 'Ручное значение'
                            : 'Расчёт: модификатор Ловкости + добавка'
                    }}</small>
                </div>
                <NFormItem label="Чувства">
                    <NInput v-model:value="draft.senses" />
                </NFormItem>
                <NFormItem label="Языки">
                    <NInput v-model:value="draft.languages" />
                </NFormItem>
            </div>
        </section>

        <section class="c-sheet-section" aria-labelledby="npc-abilities-title">
            <div class="c-section-heading">
                <h2 id="npc-abilities-title">Характеристики</h2>
                <span class="c-mode-tag mode-ready">Расчёт</span>
            </div>
            <div class="npc-ability-grid">
                <div v-for="key in abilityKeys" :key="key" class="c-field-card">
                    <NFormItem :label="abilityLabels[key]">
                        <NInputNumber min="1" max="30" :value="draft.abilities[key]"
                            @update:value="updateAbility(key, $event)" />
                    </NFormItem><strong class="npc-ability-modifier">{{
                        signedModifier(abilityModifier(draft.abilities[key]))
                    }}</strong>
                </div>
            </div>
        </section>

        <section class="c-sheet-section" aria-labelledby="npc-bonuses-title">
            <div class="c-section-heading">
                <h2 id="npc-bonuses-title">Навыки и спасброски</h2>
            </div>
            <div class="npc-bonus-columns">
                <div>
                    <div class="npc-subheading">
                        <h3>Навыки</h3>
                        <NButton @click="addBonus('skills')">Добавить</NButton>
                    </div>
                    <p v-if="!draft.skills.length" class="c-empty-collection">Навыки не указаны.</p>
                    <div v-for="entry in draft.skills" :key="entry.id" class="npc-bonus-row">
                        <NFormItem label="Название">
                            <NInput v-model:value="entry.name" />
                        </NFormItem>
                        <NFormItem label="Бонус">
                            <NInputNumber :value="entry.value" @update:value="updateBonus(entry, $event)" />
                        </NFormItem>
                        <NButton type="error" aria-label="Удалить навык" @click="removeBonus('skills', entry.id)">
                            Удалить</NButton>
                    </div>
                </div>
                <div>
                    <div class="npc-subheading">
                        <h3>Спасброски</h3>
                        <NButton @click="addBonus('savingThrows')">Добавить</NButton>
                    </div>
                    <p v-if="!draft.savingThrows.length" class="c-empty-collection">
                        Спасброски не указаны.
                    </p>
                    <div v-for="entry in draft.savingThrows" :key="entry.id" class="npc-bonus-row">
                        <NFormItem label="Название">
                            <NInput v-model:value="entry.name" />
                        </NFormItem>
                        <NFormItem label="Бонус">
                            <NInputNumber :value="entry.value" @update:value="updateBonus(entry, $event)" />
                        </NFormItem>
                        <NButton type="error" aria-label="Удалить спасбросок"
                            @click="removeBonus('savingThrows', entry.id)">Удалить</NButton>
                    </div>
                </div>
            </div>
        </section>

        <section v-for="kind in ['features', 'actions'] as const" :key="kind" class="c-sheet-section"
            :aria-labelledby="`npc-${kind}-title`">
            <div class="c-section-heading">
                <h2 :id="`npc-${kind}-title`">
                    {{ kind === 'features' ? 'Особенности' : 'Действия' }}
                </h2>
                <NButton type="default" @click="openEntry(kind)">Добавить</NButton>
            </div>
            <p v-if="!draft[kind].length" class="c-empty-collection">
                {{
                    kind === 'features'
                        ? 'Особенности пока не добавлены.'
                        : 'Действия пока не добавлены.'
                }}
            </p>
            <div v-for="entry in draft[kind]" :key="entry.id" class="c-entry-card npc-entry-card">
                <div>
                    <h3>{{ entry.name || 'Без названия' }}</h3>
                    <p>{{ entry.description || 'Описание не указано.' }}</p>
                    <small v-if="entry.attackBonus || entry.damage">{{ entry.attackBonus
                        }}<span v-if="entry.attackBonus && entry.damage"> · </span>{{ entry.damage }}</small>
                </div>
                <div class="c-entry-actions">
                    <NButton @click="openEntry(kind, entry)">Изменить</NButton>
                    <NButton type="error" @click="removeEntry(kind, entry.id)">Удалить</NButton>
                </div>
            </div>
        </section>
        <NpcEntryEditorModal v-if="entryModal.isShowModal.value && entryModal.item.value && entryModal.props.value"
            :entry="entryModal.item.value" v-bind="entryModal.props.value" @close="entryModal.openOrClose" />
    </div>
</template>

<style scoped>
.c-character-sheet .npc-mode-field {
    row-gap: 8px;
    gap: 8px;
    row-gap: 12px !important;
}

.npc-sheet-panel {
    display: grid;
    gap: 16px;
    width: 100%;
    min-width: 0;
}

.npc-sheet-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 20px;
    border: 1px solid #c8ae80;
    border-radius: 12px;
    background: linear-gradient(145deg, rgba(255, 250, 239, 0.96), rgba(247, 232, 201, 0.78));
    box-shadow: 0 5px 15px rgba(83, 59, 38, 0.065);
}

.npc-sheet-header h1 {
    margin: 2px 0 5px;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: clamp(1.35rem, 2.6vw, 2rem);
}

.npc-sheet-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
}

.npc-field-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.npc-field-grid> :nth-child(1),
.npc-field-grid> :nth-child(2),
.npc-field-grid> :nth-child(3),
.npc-field-grid> :nth-child(4),
.npc-field-grid> :nth-child(15),
.npc-field-grid> :nth-child(16) {
    grid-column: span 2;
}

.npc-derived-card {
    display: flex;
    min-height: 74px;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: 10px 12px;
    border: 1px solid #c9ac79;
    border-radius: 8px;
    background: #fff4d9;
}

.npc-mode-field {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 6px;
    color: var(--sheet-ink);
    font-size: 0.82rem;
    font-weight: 700;
}

.npc-mode-field .c-select-control {
    width: 100%;
    min-width: 0;
}

.npc-derived-card strong {
    color: var(--sheet-burgundy);
    font-size: 1.45rem;
}

.npc-derived-card small {
    color: var(--sheet-muted);
    line-height: 1.3;
}

.npc-ability-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
}

.npc-ability-grid .c-field-card {
    position: relative;
    display: grid;
    gap: 4px;
    padding: 10px;
}

.npc-ability-modifier {
    color: var(--sheet-burgundy);
    font-size: 1.2rem;
    text-align: center;
}

.npc-bonus-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.npc-subheading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
}

.npc-bonus-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(80px, 120px) auto;
    align-items: end;
    gap: 8px;
    padding: 10px 0;
    border-top: 1px solid var(--sheet-line-soft);
}

.npc-entry-card p {
    max-width: 100%;
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--sheet-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
}

.npc-entry-card h3 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
