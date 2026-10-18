<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { DICE_TYPES, diceLabel, resultLabel, rollDie, type DiceSides } from '../../domain/dice.ts'
import RollingDie from './RollingDie.vue'

interface RollRecord {
  id: number
  sides: DiceSides
  result: number
}

const selectedSides = ref<DiceSides>(20)
const result = ref<number | null>(null)
const lastRollSides = ref<DiceSides | null>(null)
const isRolling = ref(false)
const history = ref<RollRecord[]>([])
const showAllHistory = ref(false)
const visualSides = ref<DiceSides>(selectedSides.value)
let nextId = 1
let rollTimer: number | undefined
let pendingResult: number | undefined
const ROLL_DURATION_MS = 800

const resultAnnouncement = computed(() => resultLabel(lastRollSides.value ?? selectedSides.value, result.value))
const visibleHistory = computed(() => showAllHistory.value ? history.value : history.value.slice(0, 5))
const hasCollapsedHistory = computed(() => history.value.length > 5)

watch(selectedSides, (sides) => {
  if (isRolling.value) return
  visualSides.value = sides
  result.value = null
  lastRollSides.value = null
})

function roll() {
  if (isRolling.value) return
  const rollSides = selectedSides.value
  visualSides.value = rollSides
  // Resolve the domain result once at click time; the visual phase only delays its reveal.
  pendingResult = rollDie(rollSides)
  result.value = null
  isRolling.value = true
  rollTimer = window.setTimeout(() => {
    const landedResult = pendingResult
    pendingResult = undefined
    if (landedResult === undefined) {
      isRolling.value = false
      rollTimer = undefined
      return
    }
    result.value = landedResult
    lastRollSides.value = rollSides
    history.value = [{ id: nextId++, sides: rollSides, result: landedResult }, ...history.value].slice(0, 20)
    isRolling.value = false
    rollTimer = undefined
  }, ROLL_DURATION_MS)
}

function cancelRoll() {
  if (rollTimer !== undefined) {
    window.clearTimeout(rollTimer)
    rollTimer = undefined
  }
  pendingResult = undefined
  isRolling.value = false
}

function clearHistory() {
  history.value = []
  showAllHistory.value = false
  result.value = null
  lastRollSides.value = null
  cancelRoll()
  visualSides.value = selectedSides.value
}

onBeforeUnmount(cancelRoll)
</script>

<template>
  <section class="panel component-card dice-card" aria-labelledby="dice-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Локальный компонент</p>
        <h2 id="dice-title">Бросок кубиков</h2>
      </div>
      <span class="state-chip" :class="{ 'state-chip-active': isRolling }">{{ isRolling ? 'Бросок…' : 'Готово' }}</span>
    </div>

    <div class="dice-visual-stage" :class="{ 'is-rolling-stage': isRolling }" aria-label="Визуальный бросок кости">
      <div class="die-shadow" aria-hidden="true"></div>
      <RollingDie :sides="visualSides" :result="result" :rolling="isRolling" />
      <span class="die-stage-caption" aria-live="polite">{{ isRolling ? 'Кость вращается…' : result === null ? 'Готова к броску' : 'Бросок завершён' }}</span>
    </div>

    <div class="dice-controls" aria-label="Настройки броска">
      <label for="dice-type">Кость</label>
      <select id="dice-type" v-model="selectedSides" :disabled="isRolling">
        <option v-for="sides in DICE_TYPES" :key="sides" :value="sides">d{{ sides }}</option>
      </select>
      <button class="primary-button" type="button" :disabled="isRolling" @click="roll">
        {{ isRolling ? 'Бросок…' : 'Бросить' }}
      </button>
    </div>

    <div class="roll-result" :class="{ rolling: isRolling, empty: result === null }" aria-live="polite" aria-atomic="true">
      <span class="result-label">Результат</span>
      <strong>{{ result ?? '—' }}</strong>
      <span>{{ resultAnnouncement }}</span>
    </div>

    <div class="history-heading">
      <h3>История</h3>
      <button class="text-button" type="button" :disabled="history.length === 0 && !isRolling" @click="clearHistory">Очистить</button>
    </div>
    <p v-if="history.length === 0" class="empty-state">Броски появятся здесь.</p>
    <ol v-else class="roll-history" aria-label="История бросков">
      <li v-for="entry in visibleHistory" :key="entry.id"><span>{{ diceLabel(entry.sides) }}</span><strong>→ {{ entry.result }}</strong></li>
    </ol>
    <button
      v-if="hasCollapsedHistory"
      class="history-toggle text-button"
      type="button"
      :aria-expanded="showAllHistory"
      @click="showAllHistory = !showAllHistory"
    >
      {{ showAllHistory ? 'Свернуть историю' : `Показать ещё (${history.length - 5})` }}
    </button>
  </section>
</template>
