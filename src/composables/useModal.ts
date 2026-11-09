import { ref, type Ref } from "vue";

type ModalState<Item, Props> = {
  openOrClose: () => void;
  isShowModal: Ref<boolean>;
  item: Ref<Item | undefined>;
  props: Ref<Props | undefined>;
};

export function useModalUtil<Item, Props>(): ModalState<Item, Props> {
  const isShowModal = ref(false);
  const item = ref<Item>();
  const props = ref<Props>();

  function openOrClose(): void {
    isShowModal.value = !isShowModal.value;
  }

  return {
    openOrClose,
    isShowModal,
    item,
    props,
  };
}
