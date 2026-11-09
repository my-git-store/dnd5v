<script setup lang="ts">
import { useDialog } from "@/composables/useDialog";
import AttackEditor from "./AttackEditor.vue";
import type { CharacterAbilities } from "../types/character";
import type { CharacterAttackView } from "../types/characterView";

type Props = {
  attack: CharacterAttackView;
  abilities: CharacterAbilities;
  level: number;
  disabled?: boolean;
  onSave: (attack: CharacterAttackView) => void;
  onCancel?: () => void;
};

const props = defineProps<Props>();
const { close } = useDialog();

function save(attack: CharacterAttackView) {
  props.onSave(attack);
  close();
}

function cancel() {
  props.onCancel?.();
  close();
}
</script>

<template>
  <NModal :show="true" class="character-editor-modal" :on-close="cancel">
    <NCard class="character-editor-card">
      <template #header>Атака</template>
      <AttackEditor
        :attack="attack"
        :abilities="abilities"
        :level="level"
        :disabled="disabled"
        @save="save"
        @cancel="cancel"
      />
    </NCard>
  </NModal>
</template>
