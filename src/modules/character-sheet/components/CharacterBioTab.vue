<script setup lang="ts">
import { CTextarea } from '@/ui/components'
import type { CharacterPersonalityV3 } from '../types/characterV3'

const props = defineProps<{ personality: CharacterPersonalityV3; disabled?: boolean }>()
const emit = defineEmits<{ update: [personality: CharacterPersonalityV3] }>()
function update(key: keyof CharacterPersonalityV3, value: unknown) {
  emit('update', { ...props.personality, [key]: String(value ?? '') })
}
</script>

<template>
  <div class="tab-content bio-tab">
    <section class="sheet-section bio-grid">
      <CTextarea label="Черты характера" rows="4" :model-value="personality.traits" :disabled="disabled" @update:model-value="update('traits', $event)" />
      <CTextarea label="Идеалы" rows="4" :model-value="personality.ideals" :disabled="disabled" @update:model-value="update('ideals', $event)" />
      <CTextarea label="Привязанности" rows="4" :model-value="personality.bonds" :disabled="disabled" @update:model-value="update('bonds', $event)" />
      <CTextarea label="Слабости" rows="4" :model-value="personality.flaws" :disabled="disabled" @update:model-value="update('flaws', $event)" />
      <CTextarea class="bio-wide bio-biography-field" label="Биография" rows="10" :model-value="personality.biography" :disabled="disabled" @update:model-value="update('biography', $event)" />
      <CTextarea class="bio-wide" label="Особенности и дополнительные заметки" rows="5" :model-value="personality.features" :disabled="disabled" @update:model-value="update('features', $event)" />
    </section>
  </div>
</template>
