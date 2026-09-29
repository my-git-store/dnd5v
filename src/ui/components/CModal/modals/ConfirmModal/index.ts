import {useDialog} from '@/ui/components/CModal/useDialog';
import ConfirmModal from './ConfirmModal.vue';

const { open } = useDialog();

export function openConfirmModal(options: InstanceType<typeof ConfirmModal>['$props']) {
    open({
        component: ConfirmModal,
        componentProps: options,
    });
}
