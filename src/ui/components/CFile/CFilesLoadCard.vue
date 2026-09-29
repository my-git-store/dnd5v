<script setup lang="ts">
import { onUnmounted } from 'vue'
import CBtn from '../CBtn/CBtn.vue';
//import CImageCard from '../CImage/CImageCard.vue'
import { useFileDialog, type UseFileDialogOptions } from '@vueuse/core'

type Props = {
    opt?: UseFileDialogOptions,
    disable?: boolean
}

type Emits = {
    update: [FileList | null]
}

const emit = defineEmits<Emits>()
const props = withDefaults(defineProps<Props>(), {
    opt: () => {
        return {
            accept: '',
            multiple: true,
            reset: true
        }
    },
    disable: false
})

function deleteAll() {
    reset()
}

const { open, reset, onCancel, onChange } = useFileDialog({
    ...props.opt
})

onChange((fileList: FileList | null) => {
    emit('update', fileList)
})

onCancel(() => { })

onUnmounted(() => {
    deleteAll()
})
</script>

<template>
    <CBtn :disabled="props.disable" @click.prevent="open()" color-type="primary">Выбрать файлы</CBtn>
    <!-- <div class="c-flex-col h-50 gap-1! overflow-auto text-left" v-if="files">
        <span v-for="(,i) in files.length" :key="`load-file-key-${i}`">{{ files.item(i).name }}</span>
    </div> -->
</template>
