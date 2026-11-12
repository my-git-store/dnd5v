<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import CharacterActionConfirmModal from '@/components/CharacterActionConfirmModal.vue'
import type { CharacterAbilities } from '@/types/character'
import type { CharacterCombat } from '@/types/character'
import type { ShortRestResult } from '@/domain/rest'

const props = defineProps<{
    combat: CharacterCombat
    abilities: CharacterAbilities
    disabled?: boolean
    onShortRest: (dice: number) => ShortRestResult | null | Promise<ShortRestResult | null>
    onLongRest: () => void | Promise<void>
}>()

type ActionModalProps = {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
}

const actionModal = useModalUtil<undefined, ActionModalProps>()

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
    actionModal.props.value = {
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
    }
    actionModal.openOrClose()
}

function openLongRest() {
    actionModal.props.value = {
        title: 'Длительный отдых',
        message:
            'HP восстановятся до максимума, ячейки заклинаний и часть костей хитов восстановятся, временные HP и спасброски от смерти сбросятся.',
        confirmLabel: 'Отдохнуть',
        onConfirm: async () => {
            await props.onLongRest()
            status.value = 'Длительный отдых завершён. Ресурсы восстановлены.'
        },
    }
    actionModal.openOrClose()
}
</script>

<template>
    <section aria-labelledby="rest-actions-title">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h2 id="rest-actions-title">Отдых</h2>
            </div>
            <span>Доступно костей хитов: {{ availableDice }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <label class="grid gap-2"
                >Костей для короткого отдыха
                <NSelect
                    v-model:value="selectedDice"
                    class="w-full"
                    :options="diceOptions"
                    :disabled="disabled || availableDice === 0"
                />
            </label>
            <NButton
                type="default"
                :disabled="disabled || availableDice === 0"
                @click="openShortRest"
                >Короткий отдых
            </NButton>
            <NButton type="primary" :disabled="disabled" @click="openLongRest"
                >Длительный отдых</NButton
            >
        </div>
        <p v-if="status" role="status" aria-live="polite">{{ status }}</p>
        <CharacterActionConfirmModal
            v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value"
            @close="actionModal.openOrClose"
        />
    </section>
</template>
