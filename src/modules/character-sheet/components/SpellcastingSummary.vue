<script setup lang="ts">
import { computed } from 'vue'
import { ABILITY_FIELDS } from '../data/characterFields'
import { calculateSpellAttackBonus, calculateSpellSaveDc } from '../domain/spellcasting'
import { signedModifier } from '../domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '../types/character'
import type { CharacterSpellcastingV3 } from '../types/characterV3'

const props = defineProps<{ spellcasting: CharacterSpellcastingV3; abilities: CharacterAbilities; level: number; disabled?: boolean }>()
const emit = defineEmits<{ update: [spellcasting: CharacterSpellcastingV3] }>()
const abilityLabel = computed(() => ABILITY_FIELDS.find((field) => field.key === props.spellcasting.spellcastingAbility)?.label ?? 'Не настроено')
const saveDc = computed(() => calculateSpellSaveDc(props.spellcasting.spellcastingAbility, props.abilities, props.level))
const attackBonus = computed(() => calculateSpellAttackBonus(props.spellcasting.spellcastingAbility, props.abilities, props.level))
function updateAbility(value: string) {
  emit('update', { ...props.spellcasting, spellcastingAbility: value ? value as AbilityKey : null })
}
</script>

<template>
  <section class="sheet-section spellcasting-summary">
    <div class="section-heading"><div><h2>Параметры заклинаний</h2><p class="section-note">Выберите характеристику — остальные значения будут рассчитаны автоматически.</p></div><span class="mode-tag" :class="spellcasting.spellcastingAbility ? 'mode-ready' : 'mode-unset'">{{ spellcasting.spellcastingAbility ? 'Настроено' : 'Не настроено' }}</span></div>
    <div class="spellcasting-grid">
      <label class="compact-field">Характеристика заклинаний
        <select class="select-control" :value="spellcasting.spellcastingAbility ?? ''" :disabled="disabled" @change="updateAbility(($event.target as HTMLSelectElement).value)">
          <option value="">Не настроено</option><option v-for="field in ABILITY_FIELDS" :key="field.key" :value="field.key">{{ field.label }}</option>
        </select>
      </label>
      <div class="field-card derived-card"><span class="field-caption">Спасбросок заклинаний · {{ abilityLabel }}</span><strong class="combat-result">{{ saveDc === null ? 'Не настроено' : saveDc }}</strong></div>
      <div class="field-card derived-card"><span class="field-caption">Бонус атаки заклинанием · {{ abilityLabel }}</span><strong class="combat-result">{{ attackBonus === null ? 'Не настроено' : signedModifier(attackBonus) }}</strong></div>
    </div>
  </section>
</template>
