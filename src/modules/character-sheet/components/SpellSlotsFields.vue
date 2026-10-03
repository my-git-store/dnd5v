<script setup lang="ts">
import { computed } from 'vue'
import { CInput } from '@/ui/components'
import type { CharacterSpellSlotV3, CharacterSpellSlotsV3 } from '../types/characterV3'

const props = defineProps<{ slots: CharacterSpellSlotsV3; disabled?: boolean }>()
const emit = defineEmits<{ update: [slots: CharacterSpellSlotsV3] }>()
const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
function copy(): CharacterSpellSlotsV3 { return JSON.parse(JSON.stringify(props.slots)) as CharacterSpellSlotsV3 }
function integer(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0 }
function update(level: typeof levels[number], field: keyof CharacterSpellSlotV3, value: unknown) {
  const next = copy(); const slot = next[level]
  if (field === 'max') { slot.max = integer(value); slot.used = Math.min(slot.used, slot.max) }
  else slot.used = Math.min(slot.max, integer(value))
  emit('update', next)
}
function remaining(level: typeof levels[number]) { const slot = props.slots[level]; return Math.max(0, slot.max - slot.used) }
const labels = computed(() => levels.map((level) => ({ level, label: `Уровень ${level}` })))
</script>

<template>
  <section class="sheet-section">
    <div class="section-heading section-heading-stack"><div><h2>Ресурс заклинаний</h2><p class="section-note">Отмечайте использованные ячейки. Остаток считается автоматически.</p></div></div>
    <div class="spell-slots-grid">
      <div v-for="item in labels" :key="item.level" class="field-card spell-slot-card">
        <h3>{{ item.label }}</h3>
        <div class="spell-slot-fields">
          <CInput type="number" min="0" step="1" label="Макс." :model-value="slots[item.level].max" :disabled="disabled" @update:model-value="update(item.level, 'max', $event)" />
          <CInput type="number" min="0" step="1" label="Использовано" :model-value="slots[item.level].used" :disabled="disabled" @update:model-value="update(item.level, 'used', $event)" />
        </div>
        <p class="derived-value">Осталось: {{ remaining(item.level) }}</p>
      </div>
    </div>
  </section>
</template>
