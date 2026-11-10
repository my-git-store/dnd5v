<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useDialog } from "@/composables/useDialog";
import CharacterActionConfirmModal from "../character-sheet/components/CharacterActionConfirmModal.vue";
import {
  currentParticipantIdAfterRemoval,
  currentParticipantIndex,
  nextTurnIndex,
} from "../table-components/domain/initiative.ts";
import { mockBestiaryAdapter } from "../bestiary/data/mockBestiary.ts";
import type { BestiaryEntry } from "../bestiary/types.ts";
import type { CharacterEncounterParticipantV3, CharacterEncounterV3 } from "../character-sheet/types/characterV3.ts";
import "./encounter.css";

const props = defineProps<{ encounters?: CharacterEncounterV3[]; dirty: boolean; saving: boolean }>();

const emit = defineEmits<{ update: [encounters: CharacterEncounterV3[]]; status: [message: string] }>();

const { open } = useDialog();

const bestiary = mockBestiaryAdapter().list();

const draft = ref<CharacterEncounterV3[]>(JSON.parse(JSON.stringify(props.encounters ?? [])) as CharacterEncounterV3[]);

const activeId = ref<string | null>(draft.value[0]?.id ?? null);

const selectedBestiaryId = ref(bestiary[0]?.id ?? "");

const quantity = ref(1);

const actionBusy = ref(false);

const bestiaryOptions = bestiary.map((entry) => ({
  value: entry.id,
  label: `${entry.name} · HP ${entry.hitPoints} · КД ${entry.armorClass}`,
}));

const quantityOptions = Array.from({ length: 20 }, (_, index) => ({ value: index + 1, label: String(index + 1) }));

const encounterOptions = computed(() =>
  draft.value.map((encounter) => ({ value: encounter.id, label: encounter.name })),
);

function snapshot(value: CharacterEncounterV3[] | undefined): string {
  return JSON.stringify(value ?? []);
}
watch(
  () => props.encounters,
  (value) => {
    if (snapshot(value) !== snapshot(draft.value)) {
      draft.value = JSON.parse(JSON.stringify(value ?? [])) as CharacterEncounterV3[];
      if (!draft.value.some((encounter) => encounter.id === activeId.value))
        activeId.value = draft.value[0]?.id ?? null;
    }
  },
  { deep: true },
);
watch(
  draft,
  (value) => {
    if (snapshot(value) !== snapshot(props.encounters))
      emit("update", JSON.parse(JSON.stringify(value)) as CharacterEncounterV3[]);
  },
  { deep: true },
);

const activeEncounter = computed(() => draft.value.find((encounter) => encounter.id === activeId.value) ?? null);

const orderedParticipants = computed(() =>
  activeEncounter.value
    ? [...activeEncounter.value.participants].sort(
        (left, right) => right.initiative - left.initiative || left.name.localeCompare(right.name, "ru"),
      )
    : [],
);

const currentIndex = computed(() =>
  currentParticipantIndex(orderedParticipants.value, activeEncounter.value?.currentParticipantId ?? undefined),
);

const currentParticipant = computed(() =>
  orderedParticipants.value.find((participant) => participant.id === activeEncounter.value?.currentParticipantId),
);

function identifier(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function createEncounter() {
  const encounter: CharacterEncounterV3 = {
    id: identifier("encounter"),
    name: "Новое столкновение",
    round: 1,
    currentParticipantId: null,
    participants: [],
  };
  draft.value.push(encounter);
  activeId.value = encounter.id;
  emit("status", "Создано новое столкновение.");
}
function copyEncounter() {
  if (!activeEncounter.value) return;
  const copy = JSON.parse(JSON.stringify(activeEncounter.value)) as CharacterEncounterV3;
  copy.id = identifier("encounter");
  copy.name = `${copy.name || "Столкновение"} (копия)`;
  draft.value.push(copy);
  activeId.value = copy.id;
  emit("status", "Столкновение скопировано.");
}
function deleteEncounter() {
  if (!activeEncounter.value) return;
  open({
    component: CharacterActionConfirmModal,
    componentProps: {
      title: "Удалить столкновение?",
      message: "Сохранённое столкновение и его участники будут удалены.",
      confirmLabel: "Удалить",
      danger: true,
      onConfirm: () => {
        const removed = activeEncounter.value?.id;
        draft.value = draft.value.filter((encounter) => encounter.id !== removed);
        activeId.value = draft.value[0]?.id ?? null;
        emit("status", "Столкновение удалено.");
      },
    },
  });
}
function selectedEntry(): BestiaryEntry | undefined {
  return bestiary.find((entry) => entry.id === selectedBestiaryId.value);
}
function addBestiaryEntry() {
  if (!activeEncounter.value || actionBusy.value) return;
  const entry = selectedEntry();
  if (!entry) return;
  actionBusy.value = true;
  const amount = Math.min(20, Math.max(1, Math.trunc(Number(quantity.value) || 1)));

  const existingNames = new Set(activeEncounter.value.participants.map((participant) => participant.name));

  const created: CharacterEncounterParticipantV3[] = [];
  for (let index = 0; index < amount; index += 1) {
    const baseName = amount > 1 ? `${entry.name} ${index + 1}` : entry.name;

    const name = existingNames.has(baseName)
      ? `${baseName} · ${activeEncounter.value.participants.length + index + 1}`
      : baseName;
    existingNames.add(name);
    created.push({
      id: identifier(`encounter-participant-${entry.id}`),
      sourceId: entry.id,
      name,
      maxHitPoints: entry.hitPoints,
      currentHitPoints: entry.hitPoints,
      armorClass: entry.armorClass,
      initiative: entry.initiative,
      defeated: false,
    });
  }
  activeEncounter.value.participants.push(...created);
  if (!activeEncounter.value.currentParticipantId) activeEncounter.value.currentParticipantId = created[0]?.id ?? null;
  syncTracker();
  emit("status", `Добавлено участников: ${created.length}.`);
  void nextTick(() => {
    actionBusy.value = false;
  });
}
function updateParticipant(
  participant: CharacterEncounterParticipantV3,
  field: "currentHitPoints" | "initiative",
  value: unknown,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  if (field === "currentHitPoints")
    participant.currentHitPoints = Math.min(participant.maxHitPoints, Math.max(0, Math.trunc(parsed)));
  else participant.initiative = Math.trunc(parsed);
  syncTracker();
}
function removeParticipant(id: string) {
  if (!activeEncounter.value) return;
  const nextCurrentId = currentParticipantIdAfterRemoval(
    activeEncounter.value.participants,
    activeEncounter.value.currentParticipantId ?? undefined,
    id,
  );
  activeEncounter.value.participants = activeEncounter.value.participants.filter(
    (participant) => participant.id !== id,
  );
  activeEncounter.value.currentParticipantId = nextCurrentId ?? null;
  syncTracker();
}
function nextTurn() {
  if (!activeEncounter.value) return;
  const transition = nextTurnIndex(currentIndex.value, orderedParticipants.value.length);
  if (transition.index < 0) return;
  activeEncounter.value.currentParticipantId = orderedParticipants.value[transition.index]?.id ?? null;
  if (transition.roundAdvanced) activeEncounter.value.round += 1;
  syncTrackerState();
}
function resetBattle() {
  if (!activeEncounter.value) return;
  activeEncounter.value.round = 1;
  activeEncounter.value.currentParticipantId = orderedParticipants.value[0]?.id ?? null;
  activeEncounter.value.participants.forEach((participant) => {
    participant.defeated = false;
    participant.currentHitPoints = participant.maxHitPoints;
  });
  syncTrackerState();
  emit("status", "Бой сброшен.");
}
function trackerParticipants() {
  return draft.value.flatMap((encounter) =>
    encounter.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      initiative: participant.initiative,
      hitPoints: participant.currentHitPoints,
      armorClass: participant.armorClass,
    })),
  );
}
function syncTracker() {
  window.dispatchEvent(new CustomEvent("nastolka:sync-initiative-participants", { detail: trackerParticipants() }));
}
function syncTrackerState() {
  syncTracker();
  if (!activeEncounter.value) return;
  window.dispatchEvent(
    new CustomEvent("nastolka:set-initiative-state", {
      detail: { currentId: activeEncounter.value.currentParticipantId, round: activeEncounter.value.round },
    }),
  );
}
function onTrackerReady() {
  syncTracker();
}
onMounted(() => {
  window.addEventListener("nastolka:initiative-tracker-ready", onTrackerReady);
  void nextTick(syncTracker);
});
onUnmounted(() => window.removeEventListener("nastolka:initiative-tracker-ready", onTrackerReady));
</script>

<template>
  <section class="encounter-planner sheet-section" aria-labelledby="encounter-planner-title">
    <header class="encounter-heading">
      <div>
        <p class="eyebrow">Тактика</p>
        <h1 id="encounter-planner-title">Планировщик столкновения</h1>
        <p class="section-note">Соберите бой из существ бестиария и управляйте ходом.</p>
      </div>
      <NButton type="primary" @click="createEncounter">Новое столкновение</NButton>
    </header>
    <p v-if="dirty" class="status-text warning" role="status" aria-live="polite">
      Есть несохранённые изменения. Нажмите «Сохранить» в шапке листа.
    </p>
    <p v-if="!draft.length" class="empty-collection">
      Столкновений пока нет. Создайте первое, чтобы добавить участников.
    </p>
    <template v-else-if="activeEncounter">
      <div class="encounter-toolbar">
        <label
          ><span>Столкновение</span
          ><NSelect
            v-model:value="activeId"
            class="select-control"
            :options="encounterOptions"
            aria-label="Активное столкновение"
        /></label>
        <div class="encounter-toolbar-actions">
          <NButton type="default" @click="copyEncounter">Копировать</NButton
          ><NButton type="error" @click="deleteEncounter">Удалить</NButton>
        </div>
      </div>
      <NFormItem label="Название столкновения"><NInput v-model:value="activeEncounter.name" /></NFormItem>
      <div class="encounter-add-row">
        <label
          ><span>Существо из бестиария</span
          ><NSelect
            v-model:value="selectedBestiaryId"
            class="select-control"
            :options="bestiaryOptions"
            aria-label="Существо из бестиария" /></label
        ><label
          ><span>Количество</span
          ><NSelect
            v-model:value="quantity"
            class="select-control"
            :options="quantityOptions"
            aria-label="Количество экземпляров" /></label
        ><NButton type="primary" :disabled="actionBusy" @click="addBestiaryEntry">Добавить в бой</NButton>
      </div>
      <div class="encounter-battle-bar">
        <div>
          <span>Раунд</span><strong>{{ activeEncounter.round }}</strong>
        </div>
        <div>
          <span>Текущий участник</span><strong>{{ currentParticipant?.name ?? "—" }}</strong>
        </div>
        <div class="encounter-battle-actions">
          <NButton type="primary" :disabled="!orderedParticipants.length" @click="nextTurn">Следующий ход</NButton
          ><NButton type="default" :disabled="!orderedParticipants.length" @click="resetBattle">Сбросить бой</NButton>
        </div>
      </div>
      <p v-if="!orderedParticipants.length" class="empty-collection">
        Добавьте существо из бестиария, чтобы начать бой.
      </p>
      <div v-else class="encounter-participant-list" aria-label="Участники столкновения">
        <article
          v-for="participant in orderedParticipants"
          :key="participant.id"
          class="encounter-participant"
          :class="{
            current: participant.id === activeEncounter.currentParticipantId,
            defeated: participant.defeated,
          }"
        >
          <div class="encounter-participant-name">
            <span class="turn-marker" aria-hidden="true">{{
              participant.id === activeEncounter.currentParticipantId ? "◆" : "◇"
            }}</span
            ><strong>{{ participant.name }}</strong
            ><small>КД {{ participant.armorClass }} · максимум HP {{ participant.maxHitPoints }}</small>
          </div>
          <label
            ><span>Текущие HP</span
            ><NInputNumber
              class="number-input"
              :min="0"
              :max="participant.maxHitPoints"
              :value="participant.currentHitPoints"
              :aria-label="`Текущие HP: ${participant.name}`"
              @update:value="updateParticipant(participant, 'currentHitPoints', $event)" /></label
          ><label
            ><span>Инициатива</span
            ><NInputNumber
              class="number-input"
              :value="participant.initiative"
              :aria-label="`Инициатива: ${participant.name}`"
              @update:value="updateParticipant(participant, 'initiative', $event)" /></label
          ><label class="encounter-defeated"
            ><NCheckbox v-model:checked="participant.defeated" :aria-label="`Побеждён: ${participant.name}`"
              >Побеждён</NCheckbox
            ></label
          ><NButton type="error" :aria-label="`Удалить ${participant.name}`" @click="removeParticipant(participant.id)"
            >Удалить</NButton
          >
        </article>
      </div>
    </template>
  </section>
</template>
