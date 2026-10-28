<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  title: string
  id: string
  storageKey: string
  forceOpen?: boolean
}>(), { forceOpen: false })

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
  } finally { hydrated.value = true }
})
watch(() => props.forceOpen, (forceOpen) => { if (forceOpen) expanded.value = true }, { immediate: true })
watch(expanded, (value) => {
  if (!hydrated.value) return
  try { sessionStorage.setItem(stateKey, value ? 'expanded' : 'collapsed') } catch { /* ignore unavailable session storage */ }
})
</script>

<template>
  <section class="collapsible-sheet-section" :class="{ 'is-collapsed': !expanded }" :aria-labelledby="`${id}-title`">
    <header class="collapsible-sheet-heading">
      <h2 :id="`${id}-title`">{{ title }}</h2>
      <button
        type="button"
        class="collapsible-sheet-toggle"
        :aria-expanded="expanded"
        :aria-controls="contentId"
        :aria-label="expanded ? `Свернуть раздел «${title}»` : `Развернуть раздел «${title}»`"
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
