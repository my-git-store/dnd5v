<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { CBtn, openConfirmModal, useDialog } from '@/ui/components'
import { calculateAttackDamageModifier, formatAttackBonus, getAttackBonusSource, getAttackCalculationMode } from '../domain/attackBonus'
import { signedModifier } from '../domain/abilityModifier'
import { numericBonus, rollDiceFormula } from '../domain/rollFormula'
import { getRules2024Weapon, getRules2024WeaponMastery } from '../data/rules2024/index.ts'
import AttackEditorModal from './AttackEditorModal.vue'
import EmptyCollection from './shared/EmptyCollection.vue'
import EntryActions from './shared/EntryActions.vue'
import type { CharacterAbilities } from '../types/character'
import type { CharacterAttackView } from '../types/characterView'

const props = defineProps<{ attacks: CharacterAttackView[]; abilities: CharacterAbilities; level: number; disabled?: boolean }>()
const emit = defineEmits<{ update: [attacks: CharacterAttackView[]] }>()
const { open } = useDialog()
const kindLabels: Record<CharacterAttackView['kind'], string> = { melee: 'Ближняя', ranged: 'Дальняя', spell: 'Заклинание', other: 'Другое' }
const sourceLabels: Record<string, string> = { manual: 'Ручной бонус', strength: 'Сила', dexterity: 'Ловкость', constitution: 'Телосложение', intelligence: 'Интеллект', wisdom: 'Мудрость', charisma: 'Харизма' }
type RollKind = 'attack' | 'damage'
interface AttackRollRecord { id: number; attackId: string; name: string; kind: RollKind; formula: string; result: number }
const isRolling = ref(false)
const rollHistory = ref<AttackRollRecord[]>([])
const lastRoll = ref<AttackRollRecord | null>(null)
let rollTimer: number | undefined
let nextRollId = 1

function save(attack: CharacterAttackView) {
  const exists = props.attacks.some((item) => item.id === attack.id)
  emit('update', exists ? props.attacks.map((item) => item.id === attack.id ? attack : item) : [...props.attacks, attack])
}
function openEditor(attack: CharacterAttackView) {
  open({ component: AttackEditorModal, componentProps: { attack: { ...attack, properties: [...attack.properties] }, abilities: props.abilities, level: props.level, disabled: props.disabled, onSave: save } })
}
function add() {
  const attack: CharacterAttackView = { id: `attack-${Date.now()}`, name: '', kind: 'other', attackBonus: '', bonusSource: 'manual', proficient: false, calculationMode: 'manual', additionalBonus: 0, damage: '', damageType: '', properties: [], range: '', description: '', weaponId: undefined, masteryId: undefined }
  openEditor(attack)
}
function remove(id: string, name: string) {
  openConfirmModal({ text: `удалить атаку «${name || 'без названия'}»?`, onOk: () => emit('update', props.attacks.filter((item) => item.id !== id)) })
}
function attackSummary(attack: CharacterAttackView) {
  const source = getAttackBonusSource(attack)
  const mode = getAttackCalculationMode(attack)
  const bonus = formatAttackBonus(attack, props.abilities, props.level)
  const damageModifier = calculateAttackDamageModifier(attack, props.abilities)
  return { source: sourceLabels[source] ?? 'Источник не настроен', mode: mode === 'manual' ? 'Ручной бонус' : 'Расчётный бонус', bonus, damageModifier }
}
function weaponLabel(attack: CharacterAttackView): string {
  return attack.weaponId ? (getRules2024Weapon(attack.weaponId)?.name ?? attack.weaponId) : ''
}
function masteryLabel(attack: CharacterAttackView): string {
  return attack.masteryId ? (getRules2024WeaponMastery(attack.masteryId)?.name ?? attack.masteryId) : (attack.weaponMastery ?? '')
}
function damageFormula(attack: CharacterAttackView): string {
  const base = attack.damage.trim() || 'd4'
  const summary = attackSummary(attack)
  if (summary.damageModifier === null || !/^[^+\-]+$/.test(base)) return base
  return `${base} ${summary.damageModifier >= 0 ? '+' : '-'} ${Math.abs(summary.damageModifier)}`
}
function roll(attack: CharacterAttackView, kind: RollKind) {
  if (isRolling.value) return
  const summary = attackSummary(attack)
  const bonus = numericBonus(summary.bonus)
  const formula = kind === 'attack'
    ? `d20${bonus === null || bonus === 0 ? '' : bonus > 0 ? `+${bonus}` : `${bonus}`}`
    : damageFormula(attack)
  const rolled = rollDiceFormula(formula)
  if (!rolled) {
    lastRoll.value = { id: nextRollId++, attackId: attack.id, name: attack.name || 'Без названия', kind, formula: 'Формула не распознана', result: 0 }
    return
  }
  isRolling.value = true
  rollTimer = window.setTimeout(() => {
    const record = { id: nextRollId++, attackId: attack.id, name: attack.name || 'Без названия', kind, formula, result: rolled.result }
    lastRoll.value = record
    rollHistory.value = [record, ...rollHistory.value].slice(0, 20)
    isRolling.value = false
    rollTimer = undefined
  }, 280)
}
onBeforeUnmount(() => { if (rollTimer !== undefined) window.clearTimeout(rollTimer) })
</script>

<template>
  <section class="sheet-section">
    <div class="section-heading"><h2>Атаки</h2><CBtn color-type="accent" :disabled="disabled" @click="add">Добавить</CBtn></div>
    <EmptyCollection v-if="attacks.length === 0" text="Атак пока нет." />
    <div v-for="attack in attacks" :key="attack.id" class="entry-card attack-entry-card">
      <div class="attack-entry-content">
        <div class="attack-entry-head">
          <div class="attack-title">
            <span class="attack-kind-mark" aria-hidden="true">{{ attack.kind === 'ranged' ? '➶' : attack.kind === 'spell' ? '✦' : '⚔' }}</span>
            <div><h3>{{ attack.name || 'Без названия' }}</h3><div class="attack-tags"><span class="attack-kind-tag">{{ kindLabels[attack.kind] }}</span><span class="attack-mode-tag" :class="getAttackCalculationMode(attack) === 'manual' ? 'manual' : 'computed'">{{ getAttackCalculationMode(attack) === 'manual' ? 'Вручную' : 'Расчёт' }}</span><span class="attack-prof-tag">{{ attack.proficient ? 'Владение' : 'Без владения' }}</span><span v-if="weaponLabel(attack)" class="attack-kind-tag">{{ weaponLabel(attack) }}</span><span v-if="masteryLabel(attack)" class="attack-kind-tag">Мастерство: {{ masteryLabel(attack) }}</span></div></div>
          </div>
          <div class="attack-stat"><span>Атака</span><strong>{{ attackSummary(attack).bonus }}</strong></div>
          <div class="attack-stat"><span>Урон</span><strong>{{ attack.damage || '—' }}</strong><small>{{ attack.damageType || 'Тип не указан' }}</small><small v-if="attackSummary(attack).damageModifier !== null">Модификатор: {{ signedModifier(attackSummary(attack).damageModifier!) }}</small></div>
          <div class="attack-stat"><span>Дальность</span><strong>{{ attack.range || '—' }}</strong></div>
        </div>
        <div class="attack-entry-details"><span>{{ attackSummary(attack).source }}</span><span v-if="attack.properties.length">{{ attack.properties.join(' · ') }}</span><span v-if="attack.description" class="attack-description-preview" :title="attack.description">{{ attack.description }}</span></div>
      </div>
      <div class="attack-entry-actions">
        <div class="attack-roll-actions">
          <CBtn :disabled="disabled || isRolling" @click="roll(attack, 'attack')">Бросок атаки</CBtn>
          <CBtn :disabled="disabled || isRolling" @click="roll(attack, 'damage')">Бросок урона</CBtn>
        </div>
        <EntryActions :disabled="disabled || isRolling" @edit="openEditor(attack)" @remove="remove(attack.id, attack.name)" />
      </div>
    </div>
    <p v-if="lastRoll" class="attack-roll-result" role="status" aria-live="polite">{{ lastRoll.kind === 'attack' ? 'Атака' : 'Урон' }}: {{ lastRoll.formula }} → <strong>{{ lastRoll.result }}</strong></p>
    <details v-if="rollHistory.length" class="attack-roll-history">
      <summary>История бросков ({{ rollHistory.length }})</summary>
      <ul><li v-for="entry in rollHistory.slice(0, 5)" :key="entry.id">{{ entry.name }} · {{ entry.formula }} → <strong>{{ entry.result }}</strong></li></ul>
    </details>
  </section>
</template>
