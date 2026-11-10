import { useDialog } from '@/modules/character-sheet/composables/useDialog'

import ConfirmModal from './ConfirmModal.vue'
import DeleteModal from './DeleteModal.vue'

const { open } = useDialog()

export function openConfirmModal(options: InstanceType<typeof ConfirmModal>['$props']): void {
    open({ component: ConfirmModal, componentProps: options })
}

export function openDeleteModal(options: InstanceType<typeof DeleteModal>['$props']): void {
    open({ component: DeleteModal, componentProps: options })
}
