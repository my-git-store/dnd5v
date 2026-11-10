<script setup lang="ts">
import { NButton, NCard, NModal } from "naive-ui";

import { useReqDefault } from "@/composables/useReqDefault";
import { useDialog } from "@/composables/useDialog";

export type Props = {
  entityName?: string;
  deleteFunc: () => Promise<unknown>;
};

type Emits = {
  delete: [];
};

const emit = defineEmits<Emits>();

const props = withDefaults(defineProps<Props>(), {
  entityName: "",
});

const { close } = useDialog();

const { isLoading, request } = useReqDefault(true);

async function deleteFunction(): Promise<void> {
  const [, error] = await request(props.deleteFunc());
  if (error) return;
  emit("delete");
  close();
}
</script>

<template>
  <NModal :show="true" :on-close="close" :mask-closable="!isLoading">
    <NCard class="min-h-[100px] p-6!">
      <template #header>
        Вы уверены, что хотите удалить <span v-if="props.entityName">{{ props.entityName }}?</span><span v-else>?</span>
      </template>
      <div class="flex w-full gap-4">
        <NButton class="flex-1" :disabled="isLoading" @click="close">Отмена</NButton>
        <NButton class="flex-1" type="error" :loading="isLoading" @click="deleteFunction">Удалить</NButton>
      </div>
    </NCard>
  </NModal>
</template>
