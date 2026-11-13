<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { DICE_TYPES, diceLabel, resultLabel, rollDie, type DiceSides } from '../../domain/dice'
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

const diceOptions = DICE_TYPES.map(sides => ({ value: sides, label: `d${sides}` }))

let nextId = 1

let rollTimer: number | undefined

let pendingResult: number | undefined

const ROLL_DURATION_MS = 800

const resultAnnouncement = computed(() =>
    resultLabel(lastRollSides.value ?? selectedSides.value, result.value),
)

const visibleHistory = computed(() =>
    showAllHistory.value ? history.value : history.value.slice(0, 5),
)

const hasCollapsedHistory = computed(() => history.value.length > 5)

watch(selectedSides, sides => {
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
        history.value = [
            { id: nextId++, sides: rollSides, result: landedResult },
            ...history.value,
        ].slice(0, 20)
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
    <section aria-labelledby="dice-title">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <p>Локальный компонент</p>
                <h2 id="dice-title">Бросок кубиков</h2>
            </div>
            <span>{{ isRolling ? 'Бросок…' : 'Готово' }}</span>
        </div>

        <div aria-label="Визуальный бросок кости">
            <RollingDie :sides="visualSides" :result="result" :rolling="isRolling" />
            <span aria-live="polite">{{
                isRolling
                    ? 'Выполняется бросок…'
                    : result === null
                      ? 'Готова к броску'
                      : 'Бросок завершён'
            }}</span>
        </div>

        <div class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2" aria-label="Настройки броска">
            <label for="dice-type">Кость</label>
            <NSelect
                id="dice-type"
                v-model:value="selectedSides"
                :options="diceOptions"
                :disabled="isRolling"
            />
            <NButton native-type="button" :disabled="isRolling" @click="roll">
                {{ isRolling ? 'Бросок…' : 'Бросить' }}
            </NButton>
        </div>

        <div aria-live="polite" aria-atomic="true">
            <span>Результат</span>
            <strong>{{ result ?? '—' }}</strong>
            <span>{{ resultAnnouncement }}</span>
        </div>

        <div>
            <h3>История</h3>
            <NButton
                native-type="button"
                :disabled="history.length === 0 && !isRolling"
                @click="clearHistory"
            >
                Очистить
            </NButton>
        </div>
        <p v-if="history.length === 0">Броски появятся здесь.</p>
        <ol v-else aria-label="История бросков">
            <li v-for="entry in visibleHistory" :key="entry.id">
                <span>{{ diceLabel(entry.sides) }}</span
                ><strong>→ {{ entry.result }}</strong>
            </li>
        </ol>
        <NButton
            v-if="hasCollapsedHistory"
            native-type="button"
            :aria-expanded="showAllHistory"
            @click="showAllHistory = !showAllHistory"
        >
            {{ showAllHistory ? 'Свернуть историю' : `Показать ещё (${history.length - 5})` }}
        </NButton>
    </section>
</template>
