<script setup lang="ts">
import { onUnmounted, watch } from "vue";

import { useDialog } from "@/composables/useDialog";

const { modals, close } = useDialog();

function updateBodyOverflow(): void {
  document.body.style.overflow = modals.value.length > 0 ? "hidden" : "";
}

watch(modals, updateBodyOverflow, { immediate: true });
onUnmounted(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <component
    :is="modal.component"
    v-for="(modal, index) in modals"
    :key="`modal-${index}`"
    v-bind="modal.componentProps"
    @close="close"
  />
</template>
