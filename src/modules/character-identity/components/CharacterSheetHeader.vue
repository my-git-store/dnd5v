<script setup lang="ts">
import { computed } from 'vue'
import { NButton } from 'naive-ui'

import { proficiencyBonus } from '@/domain/proficiencyBonus'
import { signedModifier } from '@/domain/abilityModifier'
import { useCharacterSheet } from '@/composables/useCharacterSheet'

import IdentityFields from './IdentityFields.vue'

const { character, isDirty, save } = useCharacterSheet()

const proficiencyLabel = computed(() => {
    if (!character.value) return '-'
    const bonus = proficiencyBonus(character.value.identity.level)
    return bonus === null ? '-' : signedModifier(bonus)
})
</script>

<template>
    <header v-if="character" class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
                <h1>{{ character.identity.name || 'Безымянный герой' }}</h1>
                <p>
                    Бонус владения <strong>{{ proficiencyLabel }}</strong>
                </p>
            </div>
            <NButton class="shrink-0" type="primary" :disabled="!isDirty" @click="save">
                Сохранить
            </NButton>
        </div>
        <IdentityFields />
    </header>
</template>
