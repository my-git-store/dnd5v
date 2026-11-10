import "./styles/index.css";
import "./ui/styles/index.css";

import {
  NButton,
  NCard,
  NCheckbox,
  NConfigProvider,
  NDialogProvider,
  NFormItem,
  NInput,
  NInputNumber,
  NMessageProvider,
  NModal,
  NModalProvider,
  NNotificationProvider,
  NSpin,
  NSelect,
  NTab,
  NTabs,
} from "naive-ui";
import { createApp } from "vue";

import App from "./App.vue";
import { assetUrl } from "./config/assets";

document.documentElement.style.setProperty(
  "--sheet-map-background",
  `url("${assetUrl("/character-sheet-parchment.png")}")`,
);

const app = createApp(App);

const registerComponent = (name: string, component: unknown): void => {
  app.component(name, component as never);
};

registerComponent("NButton", NButton);
registerComponent("NCard", NCard);
registerComponent("NCheckbox", NCheckbox);
registerComponent("NConfigProvider", NConfigProvider);
registerComponent("NDialogProvider", NDialogProvider);
registerComponent("NFormItem", NFormItem);
registerComponent("NInput", NInput);
registerComponent("NInputNumber", NInputNumber);
registerComponent("NMessageProvider", NMessageProvider);
registerComponent("NModal", NModal);
registerComponent("NModalProvider", NModalProvider);
registerComponent("NNotificationProvider", NNotificationProvider);
registerComponent("NSpin", NSpin);
registerComponent("NSelect", NSelect);
registerComponent("NTab", NTab);
registerComponent("NTabs", NTabs);

app.mount("#app");
