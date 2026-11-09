<script setup lang="ts">
import { useDialog } from "@/composables/useDialog";
import type { CharacterV3 } from "../types/characterV3";

const props = defineProps<{
  characters: CharacterV3[];
  currentAvailable: boolean;
  onImport: (mode: "add" | "replace") => void | Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const { close } = useDialog();
async function importCharacters(mode: "add" | "replace") {
  await props.onImport(mode);
  close();
}
</script>

<template>
  <NModal :show="true" :on-close="() => emit('close')">
    <section
      class="character-import-modal sheet-section"
      role="dialog"
      aria-modal="true"
      aria-label="Импорт персонажей"
    >
      <h2>Импорт персонажей</h2>
      <p>
        Найдено персонажей: <strong>{{ characters.length }}</strong
        >. Текущие данные не изменятся до подтверждения действия.
      </p>
      <ul class="character-import-preview">
        <li v-for="character in characters" :key="character.id">
          <strong>{{ character.identity.name || "Безымянный герой" }}</strong>
          <span
            >Уровень {{ character.identity.level }} ·
            {{ character.ruleset === "2024" ? "D&amp;D 2024" : "D&amp;D 2014" }}</span
          >
        </li>
      </ul>
      <div class="editor-actions">
        <NButton type="default" @click="close">Отмена</NButton>
        <NButton :disabled="!currentAvailable" @click="importCharacters('replace')">Заменить текущего</NButton>
        <NButton type="primary" @click="importCharacters('add')">Добавить как новых</NButton>
      </div>
    </section>
  </NModal>
</template>
