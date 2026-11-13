<script setup lang="ts">
import { ref } from 'vue'
import { NButton } from 'naive-ui'
import { useModalUtil } from '@/composables/useModal'
import { useAttacks } from '../composables/useAttacks'
import {
    calculateAttackDamageModifier,
    formatAttackBonus,
    getAttackBonusSource,
    getAttackCalculationMode,
} from '@/domain/attackBonus'
import { signedModifier } from '@/domain/abilityModifier'
import { getRules2024Weapon, getRules2024WeaponMastery } from '@/data/rules2024/index.ts'
import AttackEditorModal from './AttackEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterAbilities } from '@/types/character'
import type { CharacterAttackRecord } from '@/types/character'

type Emits = {
    update: [attacks: CharacterAttackRecord[]]
}

const props = defineProps<{
    attacks: CharacterAttackRecord[]
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const { attacks, createAttackDraft, saveAttack, removeAttack } = useAttacks(
    () => props.attacks,
    attacks => emit('update', attacks),
)

type EditorModalProps = {
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
    onSave: (attack: CharacterAttackRecord) => void
}

const editorModal = useModalUtil<CharacterAttackRecord, EditorModalProps>()

const kindLabels: Record<CharacterAttackRecord['kind'], string> = {
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

function openEditor(attack: CharacterAttackRecord) {
    editorModal.item.value = { ...attack, properties: [...attack.properties] }
    editorModal.props.value = {
        abilities: props.abilities,
        level: props.level,
        disabled: props.disabled,
        onSave: saveAttack,
    }
    editorModal.openOrClose()
}
function add() {
    openEditor(createAttackDraft())
}
function attackSummary(attack: CharacterAttackRecord) {
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
function weaponLabel(attack: CharacterAttackRecord): string {
    return attack.weaponId ? (getRules2024Weapon(attack.weaponId)?.name ?? attack.weaponId) : ''
}
function masteryLabel(attack: CharacterAttackRecord): string {
    return attack.masteryId
        ? (getRules2024WeaponMastery(attack.masteryId)?.name ?? attack.masteryId)
        : (attack.weaponMastery ?? '')
}
</script>

<template>
    <section>
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Атаки</h2>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="attacks.length === 0" text="Атак пока нет." />
        <div v-for="attack in attacks" :key="attack.id" class="py-3 flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
                <div>
                    <div>
                        <div>
                            <h3>{{ attack.name || 'Без названия' }}</h3>
                            <div class="flex flex-wrap items-center gap-2">
                                <span>{{ kindLabels[attack.kind] }}</span><span>{{
                                    getAttackCalculationMode(attack) === 'manual'
                                        ? 'Вручную'
                                        : 'Расчёт'
                                }}</span><span>{{ attack.proficient ? 'Владение' : 'Без владения' }}</span><span
                                    v-if="weaponLabel(attack)">{{ weaponLabel(attack) }}</span><span
                                    v-if="masteryLabel(attack)">Мастерство: {{ masteryLabel(attack) }}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <span>Атака</span><strong>{{ attackSummary(attack).bonus }}</strong>
                    </div>
                    <div>
                        <span>Урон</span><strong>{{ attack.damage || '—' }}</strong><small>{{ attack.damageType ||
                            'Типне указан' }}</small><small
                            v-if="attackSummary(attack).damageModifier !== null">Модификатор:
                            {{ signedModifier(attackSummary(attack).damageModifier!) }}</small>
                    </div>
                    <div>
                        <span>Дальность</span><strong>{{ attack.range || '—' }}</strong>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span>{{ attackSummary(attack).source }}</span><span v-if="attack.properties.length">{{
                        attack.properties.join(' · ') }}</span><span v-if="attack.description"
                        :title="attack.description">{{
                            attack.description
                        }}</span>
                </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <EntryActions :disabled="disabled || isRolling" @edit="openEditor(attack)"
                    @remove="removeAttack(attack.id)" />
            </div>
        </div>
        <p v-if="lastRoll" role="status" aria-live="polite">
            {{ lastRoll.kind === 'attack' ? 'Атака' : 'Урон' }}: {{ lastRoll.formula }} →
            <strong>{{ lastRoll.result }}</strong>
        </p>
        <details v-if="rollHistory.length">
            <summary>История бросков ({{ rollHistory.length }})</summary>
            <ul>
                <li v-for="entry in rollHistory.slice(0, 5)" :key="entry.id">
                    {{ entry.name }} · {{ entry.formula }} → <strong>{{ entry.result }}</strong>
                </li>
            </ul>
        </details>
        <AttackEditorModal v-if="
            editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
        " :attack="editorModal.item.value" v-bind="editorModal.props.value" @close="editorModal.openOrClose" />
    </section>
</template>
