<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
    currentParticipantIdAfterRemoval,
    currentParticipantIndex,
    nextTurnIndex,
    sortInitiative,
    type InitiativeParticipant,
} from '../../domain/initiative'

const nextId = ref(4)

const participants = ref<InitiativeParticipant[]>([
    { id: 'ellara', name: 'Эллара', initiative: 18 },
    { id: 'goblin', name: 'Гоблин', initiative: 14 },
    { id: 'warrior', name: 'Воин', initiative: 10 },
])

const currentParticipantId = ref('ellara')

const round = ref(1)

const newName = ref('')

const newInitiative = ref(10)

const orderedParticipants = computed(() => sortInitiative(participants.value))

const currentIndex = computed(() =>
    currentParticipantIndex(orderedParticipants.value, currentParticipantId.value),
)

const currentParticipant = computed(() =>
    orderedParticipants.value.find(participant => participant.id === currentParticipantId.value),
)

function addParticipant() {
    const name = newName.value.trim()
    if (!name || !Number.isFinite(newInitiative.value)) return
    participants.value = sortInitiative([
        ...participants.value,
        { id: `participant-${nextId.value++}`, name, initiative: newInitiative.value },
    ])
    newName.value = ''
}

function updateParticipant(
    id: string,
    patch: Partial<Pick<InitiativeParticipant, 'name' | 'initiative'>>,
) {
    participants.value = sortInitiative(
        participants.value.map(participant =>
            participant.id === id ? { ...participant, ...patch } : participant,
        ),
    )
}

function removeParticipant(id: string) {
    const nextCurrentId = currentParticipantIdAfterRemoval(
        orderedParticipants.value,
        currentParticipantId.value,
        id,
    )
    participants.value = participants.value.filter(participant => participant.id !== id)
    if (participants.value.length === 0) {
        currentParticipantId.value = ''
        return
    }
    currentParticipantId.value = nextCurrentId ?? orderedParticipants.value[0]!.id
}

function nextTurn() {
    const transition = nextTurnIndex(currentIndex.value, orderedParticipants.value.length)
    if (transition.index < 0) return
    currentParticipantId.value = orderedParticipants.value[transition.index]?.id ?? ''
    if (transition.roundAdvanced) round.value += 1
}
type BestiaryInitiativeDetail = {
    id: string
    name: string
    initiative: number
    hitPoints: number
    armorClass: number
}
function addFromBestiary(event: Event) {
    const detail = (event as CustomEvent<BestiaryInitiativeDetail>).detail
    if (
        !detail ||
        typeof detail.id !== 'string' ||
        !detail.name ||
        !Number.isFinite(detail.initiative)
    )
        return
    const existing = participants.value.find(participant => participant.id === detail.id)
    if (existing) {
        currentParticipantId.value = existing.id
        return
    }
    participants.value = sortInitiative([...participants.value, detail])
    currentParticipantId.value = detail.id
}
function syncParticipants(event: Event) {
    const details = (event as CustomEvent<BestiaryInitiativeDetail[]>).detail
    if (!Array.isArray(details)) return
    const known = new Map(participants.value.map(participant => [participant.id, participant]))
    for (const detail of details) {
        if (
            !detail ||
            typeof detail.id !== 'string' ||
            !detail.name ||
            !Number.isFinite(detail.initiative)
        )
            continue
        const current = known.get(detail.id)
        if (current) {
            current.name = detail.name
            current.initiative = detail.initiative
            current.hitPoints = detail.hitPoints
            current.armorClass = detail.armorClass
        } else known.set(detail.id, detail)
    }
    participants.value = sortInitiative([...known.values()])
}
function setTrackerState(event: Event) {
    const detail = (event as CustomEvent<{ currentId: string | null; round: number }>).detail
    if (!detail) return
    if (
        detail.currentId !== null &&
        participants.value.some(participant => participant.id === detail.currentId)
    )
        currentParticipantId.value = detail.currentId
    if (Number.isInteger(detail.round) && detail.round > 0) round.value = detail.round
}
onMounted(() => {
    window.addEventListener('nastolka:add-initiative-participant', addFromBestiary)
    window.addEventListener('nastolka:sync-initiative-participants', syncParticipants)
    window.addEventListener('nastolka:set-initiative-state', setTrackerState)
    window.dispatchEvent(new CustomEvent('nastolka:initiative-tracker-ready'))
})
onUnmounted(() => {
    window.removeEventListener('nastolka:add-initiative-participant', addFromBestiary)
    window.removeEventListener('nastolka:sync-initiative-participants', syncParticipants)
    window.removeEventListener('nastolka:set-initiative-state', setTrackerState)
})
</script>

<template>
    <section aria-labelledby="initiative-title">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <p>Локальный компонент</p>
                <h2 id="initiative-title">Трекер инициативы</h2>
            </div>
            <span>Раунд {{ round }}</span>
        </div>

        <form
            class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2"
            @submit.prevent="addParticipant"
        >
            <label>
                <span>Имя участника</span>
                <NInput v-model:value="newName" placeholder="Например, Гоблин" maxlength="60" />
            </label>
            <label>
                <span>Инициатива</span>
                <NInputNumber
                    v-model:value="newInitiative"
                    button-placement="both"
                    :min="-99"
                    :max="99"
                />
            </label>
            <NButton native-type="submit" :disabled="!newName.trim()"> Добавить </NButton>
        </form>

        <div v-if="orderedParticipants.length === 0">
            Добавьте первого участника, чтобы начать раунд.
        </div>
        <ol v-else aria-label="Порядок инициативы">
            <li v-for="participant in orderedParticipants" :key="participant.id">
                <span aria-hidden="true">{{
                    participant.id === currentParticipant?.id ? '◆' : '◇'
                }}</span>
                <div>
                    <NInput
                        :aria-label="`Имя: ${participant.name}`"
                        :value="participant.name"
                        maxlength="60"
                        @update:value="updateParticipant(participant.id, { name: $event })"
                    /><small
                        v-if="
                            participant.hitPoints !== undefined ||
                            participant.armorClass !== undefined
                        "
                        >{{
                            participant.hitPoints !== undefined
                                ? `HP ${participant.hitPoints}`
                                : ''
                        }}<span
                            v-if="
                                participant.hitPoints !== undefined &&
                                participant.armorClass !== undefined
                            "
                        >
                            · </span
                        >{{
                            participant.armorClass !== undefined
                                ? `КД ${participant.armorClass}`
                                : ''
                        }}</small
                    >
                </div>
                <NInputNumber
                    button-placement="both"
                    :aria-label="`Инициатива: ${participant.name}`"
                    :min="-99"
                    :max="99"
                    :value="participant.initiative"
                    @update:value="updateParticipant(participant.id, { initiative: $event ?? 0 })"
                />
                <NButton
                    native-type="button"
                    :aria-label="`Удалить ${participant.name}`"
                    @click="removeParticipant(participant.id)"
                >
                    ×
                </NButton>
            </li>
        </ol>

        <div>
            <p aria-live="polite">
                <span>Текущий ход:</span> <strong>{{ currentParticipant?.name ?? '—' }}</strong>
            </p>
            <NButton
                native-type="button"
                :disabled="orderedParticipants.length === 0"
                @click="nextTurn"
            >
                Следующий ход
            </NButton>
        </div>
    </section>
</template>
