<script setup lang="ts">
import { CBtn, CInput } from '@/ui/components'
import { proficiencyBonus } from '../domain/proficiencyBonus'
import { signedModifier } from '../domain/abilityModifier'

defineProps<{
  dirty: boolean
  saving: boolean
  saved: boolean
  saveError: string | null
  race: string
  className: string
  level: number
  experience: number
}>()
const name = defineModel<string>('name', { required: true })
const emit = defineEmits<{ save: [] }>()
</script>
<template>
  <header class="sheet-header">
    <div>
      <p class="eyebrow">Nastolka · Лист персонажа D&amp;D 5e</p>
      <CInput v-model="name" :disabled="saving" aria-label="Имя персонажа" placeholder="Имя персонажа" />
      <dl class="header-summary">
        <div><dt>Раса</dt><dd>{{ race || 'Не заполнено' }}</dd></div>
        <div><dt>Класс</dt><dd>{{ className || 'Не заполнено' }}</dd></div>
        <div><dt>Уровень</dt><dd>{{ level }}</dd></div>
        <div><dt>Опыт</dt><dd>{{ experience }}</dd></div>
        <div><dt>Бонус владения</dt><dd>{{ proficiencyBonus(level) === null ? '—' : signedModifier(proficiencyBonus(level)!) }}</dd></div>
      </dl>
      <p v-if="saveError" class="status-text error" role="alert">{{ saveError }}</p>
      <p v-else-if="saving" class="status-text pending" role="status" aria-live="polite">Сохраняется…</p>
      <p v-else-if="dirty" class="status-text warning" role="status" aria-live="polite">Есть несохранённые изменения</p>
      <p v-else-if="saved" class="status-text success" role="status" aria-live="polite">Сохранено</p>
    </div>
    <CBtn color-type="primary" :loading="saving" :disabled="!dirty" @click="emit('save')">Сохранить</CBtn>
  </header>
</template>
