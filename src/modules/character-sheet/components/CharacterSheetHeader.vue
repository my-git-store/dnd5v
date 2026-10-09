<script setup lang="ts">
import { CBtn, CInput } from '@/ui/components'
import { proficiencyBonus } from '../domain/proficiencyBonus'
import { signedModifier } from '../domain/abilityModifier'
import type { CharacterRuleset } from '../types/characterV3'

defineProps<{
  dirty: boolean
  saving: boolean
  saved: boolean
  saveError: string | null
  race: string
  className: string
  classIcon?: string
  ruleset: CharacterRuleset
  level: number
  experience: number
}>()
const name = defineModel<string>('name', { required: true })
const emit = defineEmits<{ save: []; 'open-details': [] }>()
</script>
<template>
  <header class="sheet-header">
    <div>
      <p class="eyebrow">Nastolka · Лист персонажа D&amp;D 5e</p>
      <CInput v-model="name" :disabled="saving" aria-label="Имя персонажа" placeholder="Имя персонажа" />
      <dl class="header-summary">
        <div><dt>Раса</dt><dd>{{ race || 'Не заполнено' }}</dd></div>
        <div class="header-class-entry"><dt>Класс</dt><dd class="header-class-value"><span class="class-avatar" aria-hidden="true"><img v-if="classIcon" :src="classIcon" class="class-avatar-image" alt="" /><span v-else>{{ className?.slice(0, 1) || '✦' }}</span></span><span>{{ className || 'Не заполнено' }}</span></dd></div>
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
      <CBtn class="sheet-save-button" color-type="primary" :loading="saving" :disabled="!dirty" @click="emit('save')">{{ saved ? 'Сохранено' : 'Сохранить' }}</CBtn>
    </div>
  </header>
</template>
