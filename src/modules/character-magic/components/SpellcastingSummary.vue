<script setup lang="ts">
import { computed } from 'vue'
import { ABILITY_FIELDS } from '@/data/characterFields'
import { calculateSpellAttackBonus } from '@/domain/spellcasting'
import { signedModifier } from '@/domain/abilityModifier'
import type { AbilityKey, CharacterAbilities } from '@/types/character'
import type { CharacterSpellcasting } from '@/types/character'

type Emits = {
    update: [spellcasting: CharacterSpellcasting]
}

const props = defineProps<{
    spellcasting: CharacterSpellcasting
    abilities: CharacterAbilities
    level: number
    disabled?: boolean
}>()

const emit = defineEmits<Emits>()

const abilityOptions = [
    { value: '', label: 'Не настроено' },
    ...ABILITY_FIELDS.map(field => ({ value: field.key, label: field.label })),
]

const abilityLabel = computed(
    () =>
        ABILITY_FIELDS.find(field => field.key === props.spellcasting.spellcastingAbility)?.label ??
        'Не настроено',
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
    <section class="c-sheet-section spellcasting-summary">
        <div class="c-section-heading">
            <div>
                <h2>Параметры заклинаний</h2>
                <p class="c-section-note">
                    Выберите характеристику — остальные значения будут рассчитаны автоматически.
                </p>
            </div>
            <div class="section-heading-badges">
                <span class="c-mode-tag mode-ready">D&amp;D 2024</span><span class="c-mode-tag"
                    :class="spellcasting.spellcastingAbility ? 'mode-ready' : 'mode-unset'">{{
                        spellcasting.spellcastingAbility ? 'Настроено' : 'Не настроено' }}</span>
            </div>
        </div>
        <div class="spellcasting-grid">
            <label class="c-compact-field spellcasting-ability-field">Характеристика заклинаний
                <NSelect class="c-select-control" :value="spellcasting.spellcastingAbility ?? ''"
                    :options="abilityOptions" :disabled="disabled" @update:value="updateAbility" />
            </label>
            <div class="c-field-card derived-card">
                <span class="c-field-caption">Бонус атаки заклинанием · {{ abilityLabel }}</span><strong
                    class="c-combat-result">{{
                        attackBonus === null ? 'Не настроено' : signedModifier(attackBonus)
                    }}</strong>
            </div>
        </div>
    </section>
</template>

<style scoped>
.c-character-sheet .spellcasting-grid .derived-card {
    row-gap: 12px;
}

.section-heading-badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 6px;
}

.spellcasting-grid {
    display: grid;
    grid-template-columns: 1.2fr repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: stretch;
}

.spellcasting-ability-field {
    gap: 8px;
}

.derived-card {
    display: grid;
    align-content: center;
    gap: 6px;
}
</style>
