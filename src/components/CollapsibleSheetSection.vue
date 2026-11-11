<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(
    defineProps<{
        title: string
        id: string
        storageKey: string
        forceOpen?: boolean
    }>(),
    { forceOpen: false },
)

const expanded = ref(true)

const hydrated = ref(false)

const stateKey = `nastolka:sheet:collapse:${props.storageKey}:${props.id}`

const contentId = `sheet-section-content-${props.id}`

onMounted(() => {
    try {
        const stored = sessionStorage.getItem(stateKey)
        if (stored !== null) expanded.value = stored !== 'collapsed'
    } catch {
        // Session storage can be unavailable in privacy mode; the open default remains usable.
    } finally {
        hydrated.value = true
    }
})
watch(
    () => props.forceOpen,
    forceOpen => {
        if (forceOpen) expanded.value = true
    },
    { immediate: true },
)
watch(expanded, value => {
    if (!hydrated.value) return
    try {
        sessionStorage.setItem(stateKey, value ? 'expanded' : 'collapsed')
    } catch {
        /* ignore unavailable session storage */
    }
})
</script>

<template>
    <section
        class="collapsible-sheet-section"
        :class="{ 'is-collapsed': !expanded }"
        :aria-labelledby="`${id}-title`"
    >
        <header class="collapsible-sheet-heading">
            <h2 :id="`${id}-title`">{{ title }}</h2>
            <button
                type="button"
                class="collapsible-sheet-toggle"
                :aria-expanded="expanded"
                :aria-controls="contentId"
                :aria-label="
                    expanded ? `Свернуть раздел «${title}»` : `Развернуть раздел «${title}»`
                "
                @click="expanded = !expanded"
            >
                <span aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
                <span>{{ expanded ? 'Свернуть' : 'Развернуть' }}</span>
            </button>
        </header>
        <div v-show="expanded" :id="contentId" class="collapsible-sheet-content">
            <slot />
        </div>
    </section>
</template>

<style scoped>
.collapsible-sheet-section {
    margin: 0;
    min-width: 0;
}
.collapsible-sheet-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding: 8px 2px 11px;
    border-bottom: 1px solid var(--sheet-line-soft);
}
.collapsible-sheet-heading h2 {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1.18rem;
}
.collapsible-sheet-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 6px 10px;
    border: 1px solid var(--sheet-line);
    border-radius: 8px;
    background: rgba(255, 248, 231, 0.78);
    color: var(--sheet-muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 700;
}
.collapsible-sheet-toggle:hover {
    border-color: var(--sheet-gold);
    color: var(--sheet-ink);
}
.collapsible-sheet-toggle:focus-visible {
    outline: 2px solid var(--sheet-gold);
    outline-offset: 2px;
}
.collapsible-sheet-content {
    min-width: 0;
}
.collapsible-sheet-section.is-collapsed .collapsible-sheet-heading {
    margin-bottom: 0;
}
</style>
