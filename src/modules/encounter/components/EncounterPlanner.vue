<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useModalUtil } from '@/composables/useModal'
import CharacterActionConfirmModal from '@/components/CharacterActionConfirmModal.vue'
import {
    currentParticipantIdAfterRemoval,
    currentParticipantIndex,
    nextTurnIndex,
} from '@/modules/table-components/domain/initiative.ts'
import { mockBestiaryAdapter } from '@/modules/bestiary/data/mockBestiary.ts'
import type { BestiaryEntry } from '@/modules/bestiary/types/bestiary.ts'
import type { CharacterEncounterParticipant, CharacterEncounter } from '@/types/character.ts'

type Emits = {
    update: [encounters: CharacterEncounter[]]
    status: [message: string]
}

const props = defineProps<{
    encounters?: CharacterEncounter[]
    dirty: boolean
    saving: boolean
}>()

const emit = defineEmits<Emits>()

type ActionModalProps = {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm?: () => void | Promise<void>
}

const actionModal = useModalUtil<undefined, ActionModalProps>()

const bestiary = mockBestiaryAdapter().list()

const draft = ref<CharacterEncounter[]>(
    JSON.parse(JSON.stringify(props.encounters ?? [])) as CharacterEncounter[],
)

const activeId = ref<string | null>(draft.value[0]?.id ?? null)

const selectedBestiaryId = ref(bestiary[0]?.id ?? '')

const quantity = ref(1)

const actionBusy = ref(false)

const bestiaryOptions = bestiary.map(entry => ({
    value: entry.id,
    label: `${entry.name} · HP ${entry.hitPoints} · КД ${entry.armorClass}`,
}))

const quantityOptions = Array.from({ length: 20 }, (_, index) => ({
    value: index + 1,
    label: String(index + 1),
}))

const encounterOptions = computed(() =>
    draft.value.map(encounter => ({ value: encounter.id, label: encounter.name })),
)

function snapshot(value: CharacterEncounter[] | undefined): string {
    return JSON.stringify(value ?? [])
}
watch(
    () => props.encounters,
    value => {
        if (snapshot(value) !== snapshot(draft.value)) {
            draft.value = JSON.parse(JSON.stringify(value ?? [])) as CharacterEncounter[]
            if (!draft.value.some(encounter => encounter.id === activeId.value))
                activeId.value = draft.value[0]?.id ?? null
        }
    },
    { deep: true },
)
watch(
    draft,
    value => {
        if (snapshot(value) !== snapshot(props.encounters))
            emit('update', JSON.parse(JSON.stringify(value)) as CharacterEncounter[])
    },
    { deep: true },
)

const activeEncounter = computed(
    () => draft.value.find(encounter => encounter.id === activeId.value) ?? null,
)

const orderedParticipants = computed(() =>
    activeEncounter.value
        ? [...activeEncounter.value.participants].sort(
              (left, right) =>
                  right.initiative - left.initiative || left.name.localeCompare(right.name, 'ru'),
          )
        : [],
)

const currentIndex = computed(() =>
    currentParticipantIndex(
        orderedParticipants.value,
        activeEncounter.value?.currentParticipantId ?? undefined,
    ),
)

const currentParticipant = computed(() =>
    orderedParticipants.value.find(
        participant => participant.id === activeEncounter.value?.currentParticipantId,
    ),
)

function identifier(prefix: string): string {
    const uuid = globalThis.crypto?.randomUUID?.()
    return uuid
        ? `${prefix}-${uuid}`
        : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
function createEncounter() {
    const encounter: CharacterEncounter = {
        id: identifier('encounter'),
        name: 'Новое столкновение',
        round: 1,
        currentParticipantId: null,
        participants: [],
    }
    draft.value.push(encounter)
    activeId.value = encounter.id
    emit('status', 'Создано новое столкновение.')
}
function copyEncounter() {
    if (!activeEncounter.value) return
    const copy = JSON.parse(JSON.stringify(activeEncounter.value)) as CharacterEncounter
    copy.id = identifier('encounter')
    copy.name = `${copy.name || 'Столкновение'} (копия)`
    draft.value.push(copy)
    activeId.value = copy.id
    emit('status', 'Столкновение скопировано.')
}
function deleteEncounter() {
    if (!activeEncounter.value) return
    actionModal.props.value = {
        title: 'Удалить столкновение?',
        message: 'Сохранённое столкновение и его участники будут удалены.',
        confirmLabel: 'Удалить',
        danger: true,
        onConfirm: () => {
            const removed = activeEncounter.value?.id
            draft.value = draft.value.filter(encounter => encounter.id !== removed)
            activeId.value = draft.value[0]?.id ?? null
            emit('status', 'Столкновение удалено.')
        },
    }
    actionModal.openOrClose()
}
function selectedEntry(): BestiaryEntry | undefined {
    return bestiary.find(entry => entry.id === selectedBestiaryId.value)
}
function addBestiaryEntry() {
    if (!activeEncounter.value || actionBusy.value) return
    const entry = selectedEntry()
    if (!entry) return
    actionBusy.value = true
    const amount = Math.min(20, Math.max(1, Math.trunc(Number(quantity.value) || 1)))

    const existingNames = new Set(
        activeEncounter.value.participants.map(participant => participant.name),
    )

    const created: CharacterEncounterParticipant[] = []
    for (let index = 0; index < amount; index += 1) {
        const baseName = amount > 1 ? `${entry.name} ${index + 1}` : entry.name

        const name = existingNames.has(baseName)
            ? `${baseName} · ${activeEncounter.value.participants.length + index + 1}`
            : baseName
        existingNames.add(name)
        created.push({
            id: identifier(`encounter-participant-${entry.id}`),
            sourceId: entry.id,
            name,
            maxHitPoints: entry.hitPoints,
            currentHitPoints: entry.hitPoints,
            armorClass: entry.armorClass,
            initiative: entry.initiative,
            defeated: false,
        })
    }
    activeEncounter.value.participants.push(...created)
    if (!activeEncounter.value.currentParticipantId)
        activeEncounter.value.currentParticipantId = created[0]?.id ?? null
    syncTracker()
    emit('status', `Добавлено участников: ${created.length}.`)
    void nextTick(() => {
        actionBusy.value = false
    })
}
function updateParticipant(
    participant: CharacterEncounterParticipant,
    field: 'currentHitPoints' | 'initiative',
    value: unknown,
) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return
    if (field === 'currentHitPoints')
        participant.currentHitPoints = Math.min(
            participant.maxHitPoints,
            Math.max(0, Math.trunc(parsed)),
        )
    else participant.initiative = Math.trunc(parsed)
    syncTracker()
}
function removeParticipant(id: string) {
    if (!activeEncounter.value) return
    const nextCurrentId = currentParticipantIdAfterRemoval(
        activeEncounter.value.participants,
        activeEncounter.value.currentParticipantId ?? undefined,
        id,
    )
    activeEncounter.value.participants = activeEncounter.value.participants.filter(
        participant => participant.id !== id,
    )
    activeEncounter.value.currentParticipantId = nextCurrentId ?? null
    syncTracker()
}
function nextTurn() {
    if (!activeEncounter.value) return
    const transition = nextTurnIndex(currentIndex.value, orderedParticipants.value.length)
    if (transition.index < 0) return
    activeEncounter.value.currentParticipantId =
        orderedParticipants.value[transition.index]?.id ?? null
    if (transition.roundAdvanced) activeEncounter.value.round += 1
    syncTrackerState()
}
function resetBattle() {
    if (!activeEncounter.value) return
    activeEncounter.value.round = 1
    activeEncounter.value.currentParticipantId = orderedParticipants.value[0]?.id ?? null
    activeEncounter.value.participants.forEach(participant => {
        participant.defeated = false
        participant.currentHitPoints = participant.maxHitPoints
    })
    syncTrackerState()
    emit('status', 'Бой сброшен.')
}
function trackerParticipants() {
    return draft.value.flatMap(encounter =>
        encounter.participants.map(participant => ({
            id: participant.id,
            name: participant.name,
            initiative: participant.initiative,
            hitPoints: participant.currentHitPoints,
            armorClass: participant.armorClass,
        })),
    )
}
function syncTracker() {
    window.dispatchEvent(
        new CustomEvent('nastolka:sync-initiative-participants', { detail: trackerParticipants() }),
    )
}
function syncTrackerState() {
    syncTracker()
    if (!activeEncounter.value) return
    window.dispatchEvent(
        new CustomEvent('nastolka:set-initiative-state', {
            detail: {
                currentId: activeEncounter.value.currentParticipantId,
                round: activeEncounter.value.round,
            },
        }),
    )
}
function onTrackerReady() {
    syncTracker()
}
onMounted(() => {
    window.addEventListener('nastolka:initiative-tracker-ready', onTrackerReady)
    void nextTick(syncTracker)
})
onUnmounted(() => window.removeEventListener('nastolka:initiative-tracker-ready', onTrackerReady))
</script>

<template>
    <section class="grid gap-4" aria-labelledby="encounter-planner-title">
        <header>
            <div>
                <p>Тактика</p>
                <h1 id="encounter-planner-title">Планировщик столкновения</h1>
                <p>Соберите бой из существ бестиария и управляйте ходом.</p>
            </div>
            <NButton type="primary" @click="createEncounter">Новое столкновение</NButton>
        </header>
        <p v-if="dirty" role="status" aria-live="polite">
            Есть несохранённые изменения. Нажмите «Сохранить» в шапке листа.
        </p>
        <p v-if="!draft.length">
            Столкновений пока нет. Создайте первое, чтобы добавить участников.
        </p>
        <template v-else-if="activeEncounter">
            <div>
                <label
                    ><span>Столкновение</span>
                    <NSelect
                        v-model:value="activeId"
                        class="w-full"
                        :options="encounterOptions"
                        aria-label="Активное столкновение"
                    />
                </label>
                <div>
                    <NButton type="default" @click="copyEncounter">Копировать</NButton>
                    <NButton type="error" @click="deleteEncounter">Удалить</NButton>
                </div>
            </div>
            <NFormItem label="Название столкновения">
                <NInput v-model:value="activeEncounter.name" />
            </NFormItem>
            <div class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
                <label
                    ><span>Существо из бестиария</span>
                    <NSelect
                        v-model:value="selectedBestiaryId"
                        class="w-full"
                        :options="bestiaryOptions"
                        aria-label="Существо из бестиария"
                    /> </label
                ><label
                    ><span>Количество</span>
                    <NSelect
                        v-model:value="quantity"
                        class="w-full"
                        :options="quantityOptions"
                        aria-label="Количество экземпляров"
                    />
                </label>
                <NButton type="primary" :disabled="actionBusy" @click="addBestiaryEntry"
                    >Добавить в бой</NButton
                >
            </div>
            <div>
                <div>
                    <span>Раунд</span><strong>{{ activeEncounter.round }}</strong>
                </div>
                <div>
                    <span>Текущий участник</span
                    ><strong>{{ currentParticipant?.name ?? '—' }}</strong>
                </div>
                <div>
                    <NButton
                        type="primary"
                        :disabled="!orderedParticipants.length"
                        @click="nextTurn"
                        >Следующий ход
                    </NButton>
                    <NButton
                        type="default"
                        :disabled="!orderedParticipants.length"
                        @click="resetBattle"
                        >Сбросить бой
                    </NButton>
                </div>
            </div>
            <p v-if="!orderedParticipants.length">
                Добавьте существо из бестиария, чтобы начать бой.
            </p>
            <div v-else class="grid gap-2" aria-label="Участники столкновения">
                <article
                    v-for="participant in orderedParticipants"
                    :key="participant.id"
                    class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2"
                >
                    <div>
                        <span aria-hidden="true">{{
                            participant.id === activeEncounter.currentParticipantId ? '◆' : '◇'
                        }}</span
                        ><strong>{{ participant.name }}</strong
                        ><small
                            >КД {{ participant.armorClass }} · максимум HP
                            {{ participant.maxHitPoints }}</small
                        >
                    </div>
                    <label
                        ><span>Текущие HP</span>
                        <NInputNumber
                            button-placement="both"
                            :min="0"
                            :max="participant.maxHitPoints"
                            :value="participant.currentHitPoints"
                            :aria-label="`Текущие HP: ${participant.name}`"
                            @update:value="
                                updateParticipant(participant, 'currentHitPoints', $event)
                            "
                        /> </label
                    ><label
                        ><span>Инициатива</span>
                        <NInputNumber
                            button-placement="both"
                            :value="participant.initiative"
                            :aria-label="`Инициатива: ${participant.name}`"
                            @update:value="updateParticipant(participant, 'initiative', $event)"
                        /> </label
                    ><label>
                        <NCheckbox
                            v-model:checked="participant.defeated"
                            :aria-label="`Побеждён: ${participant.name}`"
                        >
                            Побеждён</NCheckbox
                        >
                    </label>
                    <NButton
                        type="error"
                        :aria-label="`Удалить ${participant.name}`"
                        @click="removeParticipant(participant.id)"
                        >Удалить</NButton
                    >
                </article>
            </div>
        </template>
        <CharacterActionConfirmModal
            v-if="actionModal.isShowModal.value && actionModal.props.value"
            v-bind="actionModal.props.value"
            @close="actionModal.openOrClose"
        />
    </section>
</template>
