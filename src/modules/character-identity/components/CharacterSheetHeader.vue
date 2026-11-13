<script setup lang="ts">
import { computed } from 'vue'

import { proficiencyBonus } from '@/domain/proficiencyBonus'
import { signedModifier } from '@/domain/abilityModifier'
import type { CharacterIdentityPatch, Character } from '@/types/character'

import IdentityFields from './IdentityFields.vue'

type Props = {
    character: Character
    dirty: boolean
    saving: boolean
    saved: boolean
    saveError: string | null
}

type Emits = {
    save: []
    update: [patch: CharacterIdentityPatch]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const proficiencyLabel = computed(() => {
    const bonus = proficiencyBonus(props.character.identity.level)
    return bonus === null ? '-' : signedModifier(bonus)
})
</script>

<template>
    <header class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
                <h1>{{ character.identity.name || 'Безымянный герой' }}</h1>
                <p>
                    Бонус владения <strong>{{ proficiencyLabel }}</strong>
                </p>
            </div>
            <NButton
                class="shrink-0"
                type="primary"
                :loading="saving"
                :disabled="!dirty || saving"
                @click="emit('save')"
            >
                {{ saved ? 'Сохранено' : 'Сохранить' }}
            </NButton>
        </div>
        <IdentityFields
            :character="character"
            :disabled="saving"
            @update="emit('update', $event)"
        />
        <p v-if="saveError" role="alert">{{ saveError }}</p>
    </header>
</template>
