<script setup lang="ts">
import { CBtn, openConfirmModal, useDialog } from '@/ui/components'
import { formatAttackBonus, getAttackBonusSource, getAttackCalculationMode } from '../domain/attackBonus'
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
  return { source: sourceLabels[source] ?? 'Источник не настроен', mode: mode === 'manual' ? 'Ручной бонус' : 'Расчётный бонус', bonus }
}
function weaponLabel(attack: CharacterAttackView): string {
  return attack.weaponId ? (getRules2024Weapon(attack.weaponId)?.name ?? attack.weaponId) : ''
}
function masteryLabel(attack: CharacterAttackView): string {
  return attack.masteryId ? (getRules2024WeaponMastery(attack.masteryId)?.name ?? attack.masteryId) : (attack.weaponMastery ?? '')
}
</script>

<template>
  <section class="sheet-section">
    <div class="section-heading"><h2>Атаки</h2><CBtn color-type="accent" :disabled="disabled" @click="add">Добавить</CBtn></div>
    <EmptyCollection v-if="attacks.length === 0" text="Атак пока нет." />
    <div v-for="attack in attacks" :key="attack.id" class="entry-card attack-entry-card">
      <template>
        <div class="attack-entry-content">
          <div class="attack-entry-head">
            <div class="attack-title">
              <span class="attack-kind-mark" aria-hidden="true">{{ attack.kind === 'ranged' ? '➶' : attack.kind === 'spell' ? '✦' : '⚔' }}</span>
              <div><h3>{{ attack.name || 'Без названия' }}</h3><div class="attack-tags"><span class="attack-kind-tag">{{ kindLabels[attack.kind] }}</span><span class="attack-mode-tag" :class="getAttackCalculationMode(attack) === 'manual' ? 'manual' : 'computed'">{{ getAttackCalculationMode(attack) === 'manual' ? 'Вручную' : 'Расчёт' }}</span><span class="attack-prof-tag">{{ attack.proficient ? 'Владение' : 'Без владения' }}</span><span v-if="weaponLabel(attack)" class="attack-kind-tag">{{ weaponLabel(attack) }}</span><span v-if="masteryLabel(attack)" class="attack-kind-tag">Мастерство: {{ masteryLabel(attack) }}</span></div></div>
            </div>
            <div class="attack-stat"><span>Атака</span><strong>{{ attackSummary(attack).bonus }}</strong></div>
            <div class="attack-stat"><span>Урон</span><strong>{{ attack.damage || '—' }}</strong><small>{{ attack.damageType || 'Тип не указан' }}</small></div>
            <div class="attack-stat"><span>Дальность</span><strong>{{ attack.range || '—' }}</strong></div>
          </div>
          <div class="attack-entry-details"><span>{{ attackSummary(attack).source }}</span><span v-if="attack.properties.length">{{ attack.properties.join(' · ') }}</span><span v-if="attack.description">{{ attack.description }}</span></div>
        </div>
        <EntryActions :disabled="disabled" @edit="openEditor(attack)" @remove="remove(attack.id, attack.name)" />
      </template>
    </div>
  </section>
</template>
