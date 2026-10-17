<script setup lang="ts">
import { CBtn } from '@/ui/components'
import { proficiencyBonus } from '../domain/proficiencyBonus'
import { signedModifier } from '../domain/abilityModifier'
import type { CharacterRuleset } from '../types/characterV3'

defineProps<{
  dirty: boolean
  saving: boolean
  saved: boolean
  saveError: string | null
  name: string
  race: string
  speciesIcon?: string
  className: string
  classIcon?: string
  backgroundName: string
  backgroundIcon?: string
  ruleset: CharacterRuleset
  level: number
  experience: number
}>()
const emit = defineEmits<{ save: []; 'open-details': [] }>()
function hideBrokenAsset(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null
  if (image) {
    image.hidden = true
    image.parentElement?.querySelector<HTMLElement>('[data-asset-fallback]')?.removeAttribute('hidden')
  }
}
</script>
<template>
  <header class="sheet-header">
    <div>
      <h1 class="sheet-character-name">{{ name || 'Безымянный герой' }}</h1>
      <dl class="header-summary">
        <div class="header-species-entry"><dt>Раса</dt><dd class="header-species-value"><span class="species-avatar" aria-hidden="true"><span data-asset-fallback :hidden="Boolean(speciesIcon)">{{ race?.slice(0, 1) || '✦' }}</span><img v-if="speciesIcon" :src="speciesIcon" class="species-avatar-image" alt="" @error="hideBrokenAsset" /></span><span>{{ race || 'Не заполнено' }}</span></dd></div>
        <div class="header-class-entry"><dt>Класс</dt><dd class="header-class-value"><span class="class-avatar" aria-hidden="true"><span data-asset-fallback :hidden="Boolean(classIcon)">{{ className?.slice(0, 1) || '✦' }}</span><img v-if="classIcon" :src="classIcon" class="class-avatar-image" alt="" @error="hideBrokenAsset" /></span><span>{{ className || 'Не выбран' }}</span></dd></div>
        <div class="header-background-entry"><dt>Предыстория</dt><dd class="header-background-value"><span class="background-avatar" aria-hidden="true"><span data-asset-fallback :hidden="Boolean(backgroundIcon)">{{ backgroundName?.slice(0, 1) || '✦' }}</span><img v-if="backgroundIcon" :src="backgroundIcon" class="background-avatar-image" alt="" @error="hideBrokenAsset" /></span><span>{{ backgroundName || 'Не выбрана' }}</span></dd></div>
        <div><dt>Уровень</dt><dd>{{ level }}</dd></div>
        <div><dt>Опыт</dt><dd>{{ experience }}</dd></div>
        <div><dt>Бонус владения</dt><dd>{{ proficiencyBonus(level) === null ? '—' : signedModifier(proficiencyBonus(level)!) }}</dd></div>
        <div><dt>Редакция</dt><dd>{{ ruleset === '2024' ? 'D&D 2024 / 5.5' : 'D&D 2014' }}</dd></div>
      </dl>
      <p v-if="saveError" class="status-text error" role="alert">{{ saveError }}</p>
      <p v-else-if="saving" class="status-text pending" role="status" aria-live="polite">Сохраняется…</p>
      <p v-else-if="dirty" class="status-text warning" role="status" aria-live="polite">Есть несохранённые изменения</p>
    </div>
    <div class="sheet-header-actions">
      <CBtn class="header-details-button" color-type="accent" :disabled="saving" @click="emit('open-details')">Сведения</CBtn>
      <CBtn class="sheet-save-button" :class="{ 'sheet-save-button-saved': saved }" color-type="primary" :loading="saving" :disabled="!dirty" @click="emit('save')">{{ saved ? 'Сохранено' : 'Сохранить' }}</CBtn>
    </div>
  </header>
</template>
