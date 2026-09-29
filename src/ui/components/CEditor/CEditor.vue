<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import SimpleImage from '@editorjs/image'
import EditorjsList from '@editorjs/list'

const props = defineProps<{
    modelValue: any
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: any): void
}>()

let editor: EditorJS | null = null

onMounted(() => {
    editor = new EditorJS({
        holder: 'editorjs',
        data: props.modelValue || {},
        tools: {
            header: Header,
            image: SimpleImage,
            list: {
                class: EditorjsList,
                inlineToolbar: true,
            },
        },
        async onChange() {
            const data = await editor?.save()
            emit('update:modelValue', data?.blocks)
        },
    })
})

onBeforeUnmount(() => {
    editor?.destroy()
    editor = null
})
</script>

<template>
    <div id="editorjs" />
</template>

<style scoped>
#editorjs {
    background-color: #f9f9f9;
    padding: 20px 30px;
    margin-bottom: 20px;
    border: 1px solid black;
}
</style>
