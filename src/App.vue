<script setup lang="ts">
import { computed, ref } from "vue";

import CharacterSheetPage from "@/modules/character-sheet/CharacterSheetPage.vue";
import ModalHost from "@/components/ModalHost.vue";
import { useColorTheme } from "@/utils/colorTheme";

const { naiveTheme, theme } = useColorTheme();
const primaryColor = ref(theme.colors.primary.primary950);
const themeOverrides = computed(() => ({
  ...naiveTheme.value,
  common: {
    ...naiveTheme.value.common,
    primaryColor: primaryColor.value,
  },
}));
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-notification-provider placement="bottom-right">
      <n-dialog-provider>
        <n-modal-provider>
          <n-message-provider placement="bottom-right" :duration="3000" :closable="true">
            <main class="app-shell">
              <CharacterSheetPage />
              <ModalHost />
            </main>
          </n-message-provider>
        </n-modal-provider>
      </n-dialog-provider>
    </n-notification-provider>
  </n-config-provider>
</template>
