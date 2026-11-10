<script setup lang="ts">
import { ref, watch } from "vue";
import { useDialog } from "@/composables/useDialog";
import type { CharacterNpcEntryV3 } from "../types/characterV3";

const props = defineProps<{ entry: CharacterNpcEntryV3; onSave: (entry: CharacterNpcEntryV3) => void }>();

const emit = defineEmits<{ close: [] }>();

const { close } = useDialog();

const draft = ref<CharacterNpcEntryV3>({ ...props.entry });
watch(
  () => props.entry,
  (value) => {
    draft.value = { ...value };
  },
  { deep: true },
);
function save() {
  if (!draft.value.name.trim()) return;
  props.onSave({ ...draft.value, name: draft.value.name.trim() });
  close();
}
</script>

<template>
  <NModal :show="true" :on-close="() => emit('close')">
    <section
      class="character-editor-card npc-entry-editor"
      role="dialog"
      aria-modal="true"
      aria-label="Редактор записи НПС"
    >
      <h2>{{ entry.id ? "Редактирование записи" : "Новая запись" }}</h2>
      <div class="editor-grid">
        <NFormItem label="Название"><NInput v-model:value="draft.name" /></NFormItem>
        <NFormItem label="Бонус атаки"><NInput v-model:value="draft.attackBonus" /></NFormItem>
        <NFormItem label="Формула урона"><NInput v-model:value="draft.damage" /></NFormItem>
        <NFormItem label="Описание"><NInput v-model:value="draft.description" type="textarea" rows="4" /></NFormItem>
      </div>
      <div class="editor-actions">
        <NButton @click="close">Отмена</NButton>
        <NButton type="primary" :disabled="!draft.name.trim()" @click="save">Сохранить</NButton>
      </div>
    </section>
  </NModal>
</template>
