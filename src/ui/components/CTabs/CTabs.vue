<script lang="ts" setup>
import { nextTick } from 'vue'
export type CTab = {
    name: string,
    value: string
}

type Props = {
    tabs: readonly CTab[]
}

const props = withDefaults(defineProps<Props>(), {
    tabs: () => []
})

const model = defineModel<string>({ required: true })
async function onKeydown(event: KeyboardEvent, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const count = props.tabs.length
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + count) % count
    const item = props.tabs[next]
    const list = (event.currentTarget as HTMLElement).parentElement
    if (!item) return
    model.value = item.value
    await nextTick()
    list?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
}
</script>

<template>
    <div role="tablist" aria-label="Разделы листа" class="tabs-list">
        <button type="button" role="tab" class="pb-3 text-sm font-semibold transition-all cursor-pointer" v-for="(item, index) in props.tabs"
            :key="`tabs-item-${item.name}`" :class="item.value === model ? 'tab-active' : 'tab-inactive'"
            :aria-selected="item.value === model" :tabindex="item.value === model ? 0 : -1"
            @keydown="onKeydown($event, index)" @click="model = item.value">{{ item.name }}</button>
    </div>
</template>

<style scoped>
.tabs-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem 2rem; border-bottom: 1px solid #f5f5f4; }
.tab-active {
    color: #3e2c1c;
    border-bottom: 2px solid #3e2c1c;
}

.tab-inactive {
    color: #a89a8e;
    border-bottom: 2px solid transparent;
}
</style>
