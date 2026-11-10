<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDialog } from '@/modules/character-sheet/composables/useDialog'
import CharacterActionConfirmModal from '@/modules/character-sheet/components/CharacterActionConfirmModal.vue'
import type { CharacterAbilities } from '@/modules/character-sheet/types/character'
import type { CharacterCombat } from '@/modules/character-sheet/types/character'
import type { ShortRestResult } from '@/modules/character-sheet/domain/rest'

const props = defineProps<{
    combat: CharacterCombat
    abilities: CharacterAbilities
    disabled?: boolean
    onShortRest: (dice: number) => ShortRestResult | null | Promise<ShortRestResult | null>
    onLongRest: () => void | Promise<void>
}>()

const { open } = useDialog()

const selectedDice = ref(1)

const status = ref<string | null>(null)

const availableDice = computed(() =>
    Math.max(0, props.combat.hitDice.total - props.combat.hitDice.spent),
)

const diceOptions = computed(() =>
    Array.from({ length: availableDice.value }, (_, index) => ({
        value: index + 1,
        label: String(index + 1),
    })),
)

function openShortRest() {
    if (availableDice.value === 0) {
        status.value = 'Для короткого отдыха нет доступных костей хитов.'
        return
    }
    selectedDice.value = Math.min(Math.max(1, selectedDice.value), availableDice.value)
    open({
        component: CharacterActionConfirmModal,
        componentProps: {
            title: 'Короткий отдых',
            message: `Можно потратить костей хитов: ${availableDice.value}. Будет потрачено: ${selectedDice.value}. Хиты восстановятся по броску кости и модификатору Телосложения, но не выше максимума.`,
            confirmLabel: 'Отдохнуть',
            onConfirm: async () => {
                const result = await props.onShortRest(selectedDice.value)
                status.value =
                    result && result.spent > 0
                        ? `Короткий отдых завершён: восстановлено ${result.healing} HP.`
                        : 'Кость хитов не потрачена.'
            },
        },
    })
}

function openLongRest() {
    open({
        component: CharacterActionConfirmModal,
        componentProps: {
            title: 'Длительный отдых',
            message:
                'HP восстановятся до максимума, ячейки заклинаний и часть костей хитов восстановятся, временные HP и спасброски от смерти сбросятся.',
            confirmLabel: 'Отдохнуть',
            onConfirm: async () => {
                await props.onLongRest()
                status.value = 'Длительный отдых завершён. Ресурсы восстановлены.'
            },
        },
    })
}
</script>

<template>
    <section class="sheet-section rest-actions-panel" aria-labelledby="rest-actions-title">
        <div class="section-heading section-heading-stack">
            <div>
                <h2 id="rest-actions-title">Отдых</h2>
                <p class="section-note">
                    Отдых меняет текущие ресурсы персонажа и сохраняется вместе с листом.
                </p>
            </div>
            <span class="mode-tag">Доступно костей хитов: {{ availableDice }}</span>
        </div>
        <div class="rest-actions-controls">
            <label class="compact-field"
                >Костей для короткого отдыха
                <NSelect
                    v-model:value="selectedDice"
                    class="select-control"
                    :options="diceOptions"
                    :disabled="disabled || availableDice === 0"
                />
            </label>
            <NButton
                type="default"
                :disabled="disabled || availableDice === 0"
                @click="openShortRest"
                >Короткий отдых</NButton
            >
            <NButton type="primary" :disabled="disabled" @click="openLongRest"
                >Длительный отдых</NButton
            >
        </div>
        <p v-if="status" class="action-status" role="status" aria-live="polite">{{ status }}</p>
    </section>
</template>
