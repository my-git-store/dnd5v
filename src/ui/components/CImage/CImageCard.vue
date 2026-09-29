<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { useDialog } from '../CModal/useDialog';
import CimagePrewiewModal from './CimagePrewiewModal.vue';

type Emits = {
    delete: [],
    dragStart: [evt: DragEvent]
}

type Props = {
    src?: string,
    prewiew?: boolean,
}

const emit = defineEmits<Emits>()

const props = withDefaults(defineProps<Props>(), {
    src: 'https://images.unsplash.com/photo-1680868543815-b8666dba60f7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80'
})

const { open } = useDialog()

function openPrewiewModal() {
    if (!props.prewiew)
        return
    open({
        component: CimagePrewiewModal,
        componentProps: {
            src: props.src
        }
    })
}
</script>

<template>
    <div class="group relative aspect-[4/5] bg-stone-100 rounded-[32px] overflow-hidden cursor-pointer"
        @click="openPrewiewModal">
        <img loading="lazy"
            class="w-full h-full rounded-xl object-cover transition-transform duration-700 group-hover:scale-110"
            :src="props.src" alt="Card Image" draggable @dragstart="emit('dragStart', $event)">
        <div class="w-full flex justify-between absolute top-2 left-2">
            <div class="bg-accent rounded-full p-2 cursor-pointer" @click.stop="emit('delete')">
                <Icon icon="lucide:trash-2" class="text-red-500" />
            </div>
        </div>
    </div>
</template>