<script setup lang="ts">
import { computed } from 'vue'

import { proficiencyBonus } from '@/domain/proficiencyBonus'
import { signedModifier } from '@/domain/abilityModifier'
import type { CharacterIdentityPatch, CharacterSheetView } from '@/types/characterView'

import IdentityFields from './IdentityFields.vue'

type Props = {
    character: CharacterSheetView
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
    const bonus = proficiencyBonus(props.character.level)
    return bonus === null ? '-' : signedModifier(bonus)
})
</script>

<template>
    <header class="sheet-header">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
                <h1 class="sheet-character-name">{{ character.name || 'Безымянный герой' }}</h1>
                <p class="header-proficiency">
                    Бонус владения <strong>{{ proficiencyLabel }}</strong>
                </p>
            </div>
            <NButton
                class="sheet-save-button shrink-0"
                :class="{ 'sheet-save-button-saved': saved }"
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
        <p v-if="saveError" class="c-status-text error" role="alert">{{ saveError }}</p>
    </header>
</template>

<style scoped>
.sheet-header {
    display: grid;
    gap: 18px;
    margin-bottom: 22px;
    padding: 23px 25px 21px;
    position: relative;
    border: 1px solid var(--sheet-line);
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(255, 251, 240, 0.94), rgba(247, 229, 195, 0.82));
    box-shadow:
        0 8px 22px rgba(83, 59, 38, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.sheet-header::before,
.sheet-header::after {
    content: '';
    position: absolute;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(122, 62, 67, 0.5),
        rgba(196, 155, 92, 0.65),
        transparent
    );
}

.sheet-header::before {
    top: 10px;
}

.sheet-header::after {
    bottom: 10px;
}

.sheet-character-name {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: clamp(1.35rem, 2.5vw, 1.95rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.02em;
    overflow-wrap: anywhere;
}

.header-proficiency {
    margin: 8px 0 0;
    color: var(--sheet-faded);
    font-size: 0.8rem;
}

.header-proficiency strong {
    margin-left: 6px;
    color: var(--sheet-ink);
}

.sheet-save-button-saved {
    border-color: rgba(63, 112, 73, 0.28);
    background: #edf5eb;
    color: var(--sheet-success);
    box-shadow: 0 4px 10px rgba(63, 112, 73, 0.16);
}
</style>
