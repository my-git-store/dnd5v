<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import {
    calculateAttackDamageModifier,
    formatAttackBonus,
    getAttackBonusSource,
    getAttackCalculationMode,
} from '@/domain/attackBonus'
import { signedModifier } from '@/domain/abilityModifier'
import { numericBonus, rollDiceFormula } from '@/domain/rollFormula'
import { getRules2024Weapon, getRules2024WeaponMastery } from '@/data/rules2024/index.ts'
import AttackEditorModal from './AttackEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterAbilities } from '@/types/character'
import type { CharacterAttackView } from '@/types/characterView'

type Emits = {
    update: [attacks: CharacterAttackView[]]
}

const props = defineProps<{
    attacks: CharacterAttackView[]
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

type EditorModalProps = {
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
    onSave: (attack: CharacterAttackView) => void
}

type ConfirmModalProps = {
    text: string
    onOk: () => void | Promise<void>
}

const editorModal = useModalUtil<CharacterAttackView, EditorModalProps>()

const confirmModal = useModalUtil<undefined, ConfirmModalProps>()

const kindLabels: Record<CharacterAttackView['kind'], string> = {
    melee: 'Ближняя',
    ranged: 'Дальняя',
    spell: 'Заклинание',
    other: 'Другое',
}

const sourceLabels: Record<string, string> = {
    manual: 'Ручной бонус',
    strength: 'Сила',
    dexterity: 'Ловкость',
    constitution: 'Телосложение',
    intelligence: 'Интеллект',
    wisdom: 'Мудрость',
    charisma: 'Харизма',
}
type RollKind = 'attack' | 'damage'
interface AttackRollRecord {
    id: number
    attackId: string
    name: string
    kind: RollKind
    formula: string
    result: number
}
const isRolling = ref(false)

const rollHistory = ref<AttackRollRecord[]>([])

const lastRoll = ref<AttackRollRecord | null>(null)

let rollTimer: number | undefined

let nextRollId = 1

function save(attack: CharacterAttackView) {
    const exists = props.attacks.some(item => item.id === attack.id)
    emit(
        'update',
        exists
            ? props.attacks.map(item => (item.id === attack.id ? attack : item))
            : [...props.attacks, attack],
    )
}
function openEditor(attack: CharacterAttackView) {
    editorModal.item.value = { ...attack, properties: [...attack.properties] }
    editorModal.props.value = {
        abilities: props.abilities,
        level: props.level,
        disabled: props.disabled,
        onSave: save,
    }
    editorModal.openOrClose()
}
function add() {
    const attack: CharacterAttackView = {
        id: `attack-${Date.now()}`,
        name: '',
        kind: 'other',
        attackBonus: '',
        bonusSource: 'manual',
        proficient: false,
        calculationMode: 'manual',
        additionalBonus: 0,
        damage: '',
        damageType: '',
        properties: [],
        range: '',
        description: '',
        weaponId: undefined,
        masteryId: undefined,
    }
    openEditor(attack)
}
function remove(id: string, name: string) {
    confirmModal.props.value = {
        text: `удалить атаку «${name || 'без названия'}»?`,
        onOk: () =>
            emit(
                'update',
                props.attacks.filter(item => item.id !== id),
            ),
    }
    confirmModal.openOrClose()
}
function attackSummary(attack: CharacterAttackView) {
    const source = getAttackBonusSource(attack)

    const mode = getAttackCalculationMode(attack)

    const bonus = formatAttackBonus(attack, props.abilities, props.level)

    const damageModifier = calculateAttackDamageModifier(attack, props.abilities)
    return {
        source: sourceLabels[source] ?? 'Источник не настроен',
        mode: mode === 'manual' ? 'Ручной бонус' : 'Расчётный бонус',
        bonus,
        damageModifier,
    }
}
function weaponLabel(attack: CharacterAttackView): string {
    return attack.weaponId ? (getRules2024Weapon(attack.weaponId)?.name ?? attack.weaponId) : ''
}
function masteryLabel(attack: CharacterAttackView): string {
    return attack.masteryId
        ? (getRules2024WeaponMastery(attack.masteryId)?.name ?? attack.masteryId)
        : (attack.weaponMastery ?? '')
}
function damageFormula(attack: CharacterAttackView): string {
    const base = attack.damage.trim() || 'd4'

    const summary = attackSummary(attack)
    if (summary.damageModifier === null || !/^[^+-]+$/.test(base)) return base
    return `${base} ${summary.damageModifier >= 0 ? '+' : '-'} ${Math.abs(summary.damageModifier)}`
}
function roll(attack: CharacterAttackView, kind: RollKind) {
    if (isRolling.value) return
    const summary = attackSummary(attack)

    const bonus = numericBonus(summary.bonus)

    const formula =
        kind === 'attack'
            ? `d20${bonus === null || bonus === 0 ? '' : bonus > 0 ? `+${bonus}` : `${bonus}`}`
            : damageFormula(attack)

    const rolled = rollDiceFormula(formula)
    if (!rolled) {
        lastRoll.value = {
            id: nextRollId++,
            attackId: attack.id,
            name: attack.name || 'Без названия',
            kind,
            formula: 'Формула не распознана',
            result: 0,
        }
        return
    }
    isRolling.value = true
    rollTimer = window.setTimeout(() => {
        const record = {
            id: nextRollId++,
            attackId: attack.id,
            name: attack.name || 'Без названия',
            kind,
            formula,
            result: rolled.result,
        }
        lastRoll.value = record
        rollHistory.value = [record, ...rollHistory.value].slice(0, 20)
        isRolling.value = false
        rollTimer = undefined
    }, 280)
}
onBeforeUnmount(() => {
    if (rollTimer !== undefined) window.clearTimeout(rollTimer)
})
</script>

<template>
    <section class="c-sheet-section">
        <div class="c-section-heading">
            <h2>Атаки</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="attacks.length === 0" text="Атак пока нет." />
        <div v-for="attack in attacks" :key="attack.id" class="c-entry-card attack-entry-card">
            <div class="attack-entry-content">
                <div class="attack-entry-head">
                    <div class="attack-title">
                        <span class="attack-kind-mark" aria-hidden="true">{{
                            attack.kind === 'ranged' ? '➶' : attack.kind === 'spell' ? '✦' : '⚔'
                        }}</span>
                        <div>
                            <h3>{{ attack.name || 'Без названия' }}</h3>
                            <div class="attack-tags">
                                <span class="attack-kind-tag">{{ kindLabels[attack.kind] }}</span
                                ><span
                                    class="attack-mode-tag"
                                    :class="
                                        getAttackCalculationMode(attack) === 'manual'
                                            ? 'manual'
                                            : 'computed'
                                    "
                                    >{{
                                        getAttackCalculationMode(attack) === 'manual'
                                            ? 'Вручную'
                                            : 'Расчёт'
                                    }}</span
                                ><span class="attack-prof-tag">{{
                                    attack.proficient ? 'Владение' : 'Без владения'
                                }}</span
                                ><span v-if="weaponLabel(attack)" class="attack-kind-tag">{{
                                    weaponLabel(attack)
                                }}</span
                                ><span v-if="masteryLabel(attack)" class="attack-kind-tag"
                                    >Мастерство: {{ masteryLabel(attack) }}</span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="attack-stat">
                        <span>Атака</span><strong>{{ attackSummary(attack).bonus }}</strong>
                    </div>
                    <div class="attack-stat">
                        <span>Урон</span><strong>{{ attack.damage || '—' }}</strong
                        ><small>{{ attack.damageType || 'Тип не указан' }}</small
                        ><small v-if="attackSummary(attack).damageModifier !== null"
                            >Модификатор:
                            {{ signedModifier(attackSummary(attack).damageModifier!) }}</small
                        >
                    </div>
                    <div class="attack-stat">
                        <span>Дальность</span><strong>{{ attack.range || '—' }}</strong>
                    </div>
                </div>
                <div class="attack-entry-details">
                    <span>{{ attackSummary(attack).source }}</span
                    ><span v-if="attack.properties.length">{{ attack.properties.join(' · ') }}</span
                    ><span
                        v-if="attack.description"
                        class="attack-description-preview"
                        :title="attack.description"
                        >{{ attack.description }}</span
                    >
                </div>
            </div>
            <div class="attack-entry-actions">
                <div class="attack-roll-actions">
                    <NButton :disabled="disabled || isRolling" @click="roll(attack, 'attack')"
                        >Бросок атаки</NButton
                    >
                    <NButton :disabled="disabled || isRolling" @click="roll(attack, 'damage')"
                        >Бросок урона</NButton
                    >
                </div>
                <EntryActions
                    :disabled="disabled || isRolling"
                    @edit="openEditor(attack)"
                    @remove="remove(attack.id, attack.name)"
                />
            </div>
        </div>
        <p v-if="lastRoll" class="attack-roll-result" role="status" aria-live="polite">
            {{ lastRoll.kind === 'attack' ? 'Атака' : 'Урон' }}: {{ lastRoll.formula }} →
            <strong>{{ lastRoll.result }}</strong>
        </p>
        <details v-if="rollHistory.length" class="attack-roll-history">
            <summary>История бросков ({{ rollHistory.length }})</summary>
            <ul>
                <li v-for="entry in rollHistory.slice(0, 5)" :key="entry.id">
                    {{ entry.name }} · {{ entry.formula }} → <strong>{{ entry.result }}</strong>
                </li>
            </ul>
        </details>
        <AttackEditorModal
            v-if="
                editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
            "
            :attack="editorModal.item.value"
            v-bind="editorModal.props.value"
            @close="editorModal.openOrClose"
        />
        <ConfirmModal
            v-if="confirmModal.isShowModal.value && confirmModal.props.value"
            v-bind="confirmModal.props.value"
            @close="confirmModal.openOrClose"
        />
    </section>
</template>

<style scoped>
.attack-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
.attack-entry-card {
    display: flex;
    align-items: center;
    gap: 14px;
}
.attack-entry-content {
    min-width: 0;
    flex: 1;
}
.attack-entry-head {
    display: grid;
    grid-template-columns: minmax(220px, 1.6fr) minmax(70px, 0.55fr) minmax(100px, 0.8fr) minmax(
            90px,
            0.7fr
        );
    align-items: start;
    gap: 14px;
}
.attack-title {
    align-items: center;
    flex-wrap: nowrap;
    gap: 10px;
}
.attack-kind-mark {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    width: 38px;
    height: 38px;
    border: 1px solid #d3ba8c;
    border-radius: 10px 10px 10px 3px;
    background: #fff2d8;
    color: #7b4e27;
    font-size: 1.2rem;
}
.attack-title > div:last-child {
    min-width: 0;
}
.attack-title h3 {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.attack-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
}
.attack-kind-tag,
.attack-mode-tag,
.attack-prof-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 6px;
    border: 1px solid var(--sheet-line-soft);
    border-radius: 5px;
    color: var(--sheet-muted);
    font-size: 0.62rem;
    font-weight: 800;
}
.attack-mode-tag.manual {
    border-color: #d6b173;
    background: #fff2d9;
    color: #78521d;
}
.attack-mode-tag.computed {
    border-color: #a8c7a4;
    background: #edf5eb;
    color: #3f7049;
}
.attack-prof-tag {
    border-color: #c9abb0;
    background: #f7eaec;
    color: #78474d;
}
.attack-stat {
    display: grid;
    align-content: start;
    align-self: start;
    gap: 3px;
    min-width: 0;
}
.attack-stat > span {
    color: var(--sheet-faded);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.attack-stat > strong {
    color: var(--sheet-ink);
    font-size: 1.18rem;
    font-variant-numeric: tabular-nums;
    font-weight: 800;
    line-height: 1.15;
    overflow-wrap: anywhere;
}
.attack-stat > small {
    color: var(--sheet-muted);
    font-size: 0.68rem;
    overflow-wrap: anywhere;
}
.attack-entry-details {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 13px;
    margin: 10px 0 0 48px;
    color: var(--sheet-muted);
    font-size: 0.72rem;
    line-height: 1.4;
}
.attack-description-preview {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.attack-entry-details span + span::before {
    content: '·';
    margin-right: 13px;
    color: #b39564;
}
.attack-entry-actions {
    display: grid;
    gap: 8px;
    justify-items: end;
    flex: 0 0 auto;
}
.attack-roll-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 5px;
}
.attack-roll-result {
    margin: 12px 0 0;
    padding: 9px 12px;
    border: 1px solid #b8c89e;
    border-radius: 8px;
    background: #edf3e5;
    color: #49633d;
}
.attack-roll-history {
    margin-top: 9px;
    color: var(--sheet-muted);
    font-size: 0.78rem;
}
.attack-roll-history summary {
    cursor: pointer;
    font-weight: 700;
}
.attack-roll-history ul {
    margin: 7px 0 0;
    padding-left: 18px;
}
.attack-roll-history li + li {
    margin-top: 4px;
}
.attack-entry-card {
    border-color: #dec9a4;
}
.attack-entry-card:hover {
    background: rgba(255, 246, 221, 0.62);
}
.attack-kind-mark {
    border-color: #bd9a61;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.5),
        0 2px 5px rgba(83, 59, 38, 0.06);
    background: #fff0d2;
    color: var(--sheet-burgundy);
}
.attack-kind-tag,
.attack-mode-tag,
.attack-prof-tag {
    border-color: #d2b989;
}
.attack-entry-details {
    color: #796149;
}
</style>
