import {useDialog} from '@/ui/components/CModal/useDialog';
import DeleteModal from './DeleteModal.vue';

const { open } = useDialog();

export function openDeleteModal(options: InstanceType<typeof DeleteModal>['$props']) {
    open({
        component: DeleteModal,
        componentProps: options,
    });
}

