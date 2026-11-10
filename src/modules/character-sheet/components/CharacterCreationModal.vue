<script setup lang="ts">
import { useDialog } from "@/composables/useDialog";
import CharacterCreationTab from "./CharacterCreationTab.vue";
import type { CharacterCreationPayload } from "../domain/characterCreation";
import type { CharacterSheetView } from "../types/characterView";

type Props = {
  character: CharacterSheetView;
  disabled?: boolean;
  onCreate: (payload: CharacterCreationPayload) => void;
  onBackToSheet: () => void;
};

const props = defineProps<Props>();

const { close } = useDialog();

function backToSheet() {
  props.onBackToSheet();
  close();
}
</script>

<template>
  <NModal :show="true" class="character-creation-modal" :on-close="close">
    <div class="character-creation-modal-content character-sheet">
      <CharacterCreationTab
        :character="character"
        :disabled="disabled"
        @create="onCreate"
        @back-to-sheet="backToSheet"
      />
    </div>
  </NModal>
</template>
