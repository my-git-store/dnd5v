<script setup lang="ts">
import { computed, onMounted } from "vue";
import { Icon } from "@iconify/vue";

export type AlertProps = {
    type: 'info' | 'warning' | 'error' | 'succes',
    title: string,
    time?: number | null,
    desc?: string
}

type Emits = {
    close: []
}

const props = withDefaults(defineProps<AlertProps>(), {
    type: 'info',
    title: '',
    time: 5000
})

const emit = defineEmits<Emits>();

const styles = computed(() => {
    const map = {
        error: {
            contaunerClass: 'error',
            icon: "lucide:x-circle",
            iconColor: "text-[#9b442a]",
        },
        warning: {
            contaunerClass: 'warning',
            icon: "lucide:alert-triangle",
            iconColor: "text-[#b98c41]",
        },
        info: {
            contaunerClass: 'info',
            icon: "lucide:info",
            iconColor: "text-[#6b7d8d]",
        },
        succes: {
            contaunerClass: 'succes',
            icon: "lucide:check-circle",
            iconColor: "text-[#10b981]",
        },
    };

    return map[props.type] || map.info;
});

async function createCloseAction() {
    if (props.time === null || props.time === 0)
        return
    setTimeout(() => {
        emit('close')
    }, props.time)
}

onMounted(async () => {
    createCloseAction()
})
</script>

<template>
    <div class="p-4 rounded-2xl min-w-50 border-l-1 flex items-center gap-4 shadow-sm" ref="CAlertRef"
        data-ignore-outside="true" :class="styles.contaunerClass">
        <Icon :icon="styles.icon" class="text-2xl" :class="styles.iconColor" />

        <div class="flex-1 space-y-1">
            <h4 class="text-sm font-bold text-[#3e2c1c]">
                {{ title }}
            </h4>
            <p class="text-xs text-stone-600 leading-relaxed" v-if="desc">
                {{ desc }}
                <slot />
            </p>
        </div>

        <button class="text-stone-400 hover:text-[#3e2c1c]" @click="emit('close')">
            <Icon icon="lucide:x" />
        </button>
    </div>
</template>

<style scoped>
.error {
    background-color: var(--color-error-100);
    border-color: var(--color-error);
}

.warning {
    background-color: var(--color-warning-100);
    border-color: var(--color-warning);
}

.info {
    background-color: var(--color-info-100);
    border-color: var(--color-info);
}

.succes {
    background-color: var(--color-succes-100);
    border-color: var(--color-succes);
}
</style>