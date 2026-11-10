<script setup lang="ts">
import { useDialog } from "@/composables/useDialog";
import CharacterFeatEditor from "./CharacterFeatEditor.vue";
import type { CharacterFeatV3 } from "../types/characterV3";

const props = defineProps<{ feat: CharacterFeatV3; disabled?: boolean; onSave: (feat: CharacterFeatV3) => void }>();

const { close } = useDialog();

function save(feat: CharacterFeatV3) {
  props.onSave(feat);
  close();
}
function cancel() {
  close();
}
</script>

<template>
  <NModal :show="true" class="character-editor-modal character-feat-editor-modal" :on-close="cancel">
    <NCard class="character-editor-card">
      <template #header>Черта персонажа</template>
      <CharacterFeatEditor :feat="feat" :disabled="disabled" @save="save" @cancel="cancel" />
    </NCard>
  </NModal>
</template>
