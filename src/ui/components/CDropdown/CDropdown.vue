<script setup lang="ts">
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef } from 'vue'
import { Icon } from '@iconify/vue';

type Props = {
    menuClass?: string,
    openContainerClass?: string,
    isArrow?: boolean
}
const props = withDefaults(defineProps<Props>(), {
    menuClass: '',
    openContainerClass: '',
    isArrow: false
})

const isOpen = ref<boolean>(false)

const dropdownRef = useTemplateRef('dropdownRef')
const dropDownOpenRef = useTemplateRef('dropDownOpenRef')

onClickOutside(dropdownRef, () => {
    isOpen.value = false
}, { ignore: [dropDownOpenRef] })
</script>

<template>
    <div class="relative">
        <div ref="dropDownOpenRef" :class="props.openContainerClass" @click="isOpen = !isOpen">
            <slot name="default" />
            <Icon v-if="props.isArrow" class="arrow-icon" :class="{ 'rotated': isOpen }" icon="ep:arrow-down"
                width="20px" height="20px" />
        </div>
        <div class="c-fade-in absolute z-10 rounded-lg bg-white p-2 c-dropdown-menu" :class="props.menuClass"
            ref="dropdownRef" v-if="isOpen" @click="isOpen = false">
            <slot name="menu" />
        </div>
    </div>
</template>

<style scoped>
.c-dropdown-menu {
    border: 1px solid var(--color-stone-200);
}

.arrow-icon {
    transition: transform 0.3s ease;
}

.arrow-icon.rotated {
    transform: rotate(180deg);
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>