<script setup lang="ts">
import { computed, ref } from 'vue'
import { currentParticipantIdAfterRemoval, currentParticipantIndex, nextTurnIndex, sortInitiative, type InitiativeParticipant } from '../../domain/initiative.ts'

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
const currentIndex = computed(() => currentParticipantIndex(orderedParticipants.value, currentParticipantId.value))
const currentParticipant = computed(() => orderedParticipants.value.find((participant) => participant.id === currentParticipantId.value))

function addParticipant() {
  const name = newName.value.trim()
  if (!name || !Number.isFinite(newInitiative.value)) return
  participants.value = sortInitiative([...participants.value, { id: `participant-${nextId.value++}`, name, initiative: newInitiative.value }])
  newName.value = ''
}

function updateParticipant(id: string, patch: Partial<Pick<InitiativeParticipant, 'name' | 'initiative'>>) {
  participants.value = sortInitiative(participants.value.map((participant) => participant.id === id ? { ...participant, ...patch } : participant))
}

function removeParticipant(id: string) {
  const nextCurrentId = currentParticipantIdAfterRemoval(orderedParticipants.value, currentParticipantId.value, id)
  participants.value = participants.value.filter((participant) => participant.id !== id)
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
</script>

<template>
  <section class="panel component-card initiative-card" aria-labelledby="initiative-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Local component</p>
        <h2 id="initiative-title">Initiative Tracker</h2>
      </div>
      <span class="round-chip">Раунд {{ round }}</span>
    </div>

    <form class="add-participant" @submit.prevent="addParticipant">
      <label>
        <span>Имя участника</span>
        <input v-model="newName" type="text" placeholder="Например, Гоблин" maxlength="60" />
      </label>
      <label>
        <span>Инициатива</span>
        <input v-model.number="newInitiative" type="number" min="-99" max="99" />
      </label>
      <button class="primary-button" type="submit" :disabled="!newName.trim()">Добавить</button>
    </form>

    <div v-if="orderedParticipants.length === 0" class="empty-state">Добавьте первого участника, чтобы начать раунд.</div>
    <ol v-else class="initiative-list" aria-label="Порядок инициативы">
      <li v-for="participant in orderedParticipants" :key="participant.id" :class="{ current: participant.id === currentParticipant?.id }">
        <span class="turn-marker" aria-hidden="true">{{ participant.id === currentParticipant?.id ? '◆' : '◇' }}</span>
        <input class="participant-name" :aria-label="`Имя: ${participant.name}`" :value="participant.name" maxlength="60" @change="updateParticipant(participant.id, { name: ($event.target as HTMLInputElement).value })" />
        <input class="participant-initiative" :aria-label="`Инициатива: ${participant.name}`" type="number" min="-99" max="99" :value="participant.initiative" @change="updateParticipant(participant.id, { initiative: Number(($event.target as HTMLInputElement).value) })" />
        <button class="icon-button" type="button" :aria-label="`Удалить ${participant.name}`" @click="removeParticipant(participant.id)">×</button>
      </li>
    </ol>

    <div class="turn-footer">
      <p aria-live="polite"><span>Текущий ход:</span> <strong>{{ currentParticipant?.name ?? '—' }}</strong></p>
      <button class="primary-button" type="button" :disabled="orderedParticipants.length === 0" @click="nextTurn">Следующий ход</button>
    </div>
  </section>
</template>
