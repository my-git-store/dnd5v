<script setup lang="ts">
import { computed } from 'vue'
import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSpellAttackBonus, calculateSpellSaveDc } from '@/domain/spellcasting'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '@/types/character'
import type { CharacterSpellcasting } from '@/types/character'

const props = defineProps<{
    spellcasting: CharacterSpellcasting
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<{ update: [spellcasting: CharacterSpellcasting] }>()

const abilityOptions = [
    { value: '', label: 'Не настроено' },
    ...ABILITY_FIELDS.map(field => ({ value: field.key, label: field.label })),
]

const abilityLabel = computed(
    () =>
        ABILITY_FIELDS.find(field => field.key === props.spellcasting.spellcastingAbility)?.label ??
        'Не настроено',
)

const saveDc = computed(() =>
    calculateSpellSaveDc(props.spellcasting.spellcastingAbility, props.abilities, props.level),
)

const attackBonus = computed(() =>
    calculateSpellAttackBonus(props.spellcasting.spellcastingAbility, props.abilities, props.level),
)

function updateAbility(value: string | null) {
    emit('update', {
        ...props.spellcasting,
        spellcastingAbility: value ? (value as AbilityKey) : null,
    })
}
</script>

<template>
    <section class="sheet-section spellcasting-summary">
        <div class="section-heading">
            <div>
                <h2>Параметры заклинаний</h2>
                <p class="section-note">
                    Выберите характеристику — остальные значения будут рассчитаны автоматически.
                </p>
            </div>
            <div class="section-heading-badges">
                <span class="mode-tag mode-ready">{{
                    spellcasting.spellRuleset === '2024' ? 'D&amp;D 2024' : 'D&amp;D 2014'
                }}</span
                ><span
                    class="mode-tag"
                    :class="spellcasting.spellcastingAbility ? 'mode-ready' : 'mode-unset'"
                    >{{ spellcasting.spellcastingAbility ? 'Настроено' : 'Не настроено' }}</span
                >
            </div>
        </div>
        <div class="spellcasting-grid">
            <label class="compact-field spellcasting-ability-field"
                >Характеристика заклинаний
                <NSelect
                    class="select-control"
                    :value="spellcasting.spellcastingAbility ?? ''"
                    :options="abilityOptions"
                    :disabled="disabled"
                    @update:value="updateAbility"
                />
            </label>
            <div class="field-card derived-card">
                <span class="field-caption">Спасбросок заклинаний · {{ abilityLabel }}</span
                ><strong class="combat-result">{{
                    saveDc === null ? 'Не настроено' : saveDc
                }}</strong>
            </div>
            <div class="field-card derived-card">
                <span class="field-caption">Бонус атаки заклинанием · {{ abilityLabel }}</span
                ><strong class="combat-result">{{
                    attackBonus === null ? 'Не настроено' : signedModifier(attackBonus)
                }}</strong>
            </div>
        </div>
    </section>
</template>
