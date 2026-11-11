<script setup lang="ts">
import CombatStatsFields from './CombatStatsFields.vue'
import AttackList from './AttackList.vue'
import RestActions from './RestActions.vue'
import type { CharacterSheetView } from '@/types/characterView'
import type { ShortRestResult } from '@/domain/rest'

defineProps<{
    character: CharacterSheetView
    disabled?: boolean
    onShortRest: (dice: number) => ShortRestResult | null | Promise<ShortRestResult | null>
    onLongRest: () => void | Promise<void>
}>()
const emit = defineEmits<{
    'update:combat': [combat: CharacterSheetView['combat']]
    'update:attacks': [attacks: CharacterSheetView['attacks']]
}>()
</script>

<template>
    <div class="c-tab-content combat-tab">
        <section class="c-sheet-section combat-intro-panel">
            <div class="combat-intro-mark" aria-hidden="true">⚔</div>
            <div>
                <h1>Бой</h1>
                <p class="c-section-note">
                    Класс брони, здоровье и атаки героя — всё, что нужно держать под рукой во время
                    сражения.
                </p>
            </div>
        </section>
        <CombatStatsFields
            :combat="character.combat"
            :abilities="character.abilities"
            :disabled="disabled"
            @update="emit('update:combat', $event)"
        />
        <RestActions
            :combat="character.combat"
            :abilities="character.abilities"
            :disabled="disabled"
            :on-short-rest="onShortRest"
            :on-long-rest="onLongRest"
        />
        <AttackList
            :attacks="character.attacks"
            :abilities="character.abilities"
            :level="character.level"
            :disabled="disabled"
            @update="emit('update:attacks', $event)"
        />
    </div>
</template>

<style scoped>
.combat-intro-panel {
    display: flex;
    align-items: center;
    gap: 14px;
    grid-column: 1 / -1;
    background: linear-gradient(135deg, rgba(255, 250, 239, 0.96), rgba(239, 218, 187, 0.78));
}
.combat-intro-mark {
    display: grid;
    place-items: center;
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    border: 1px solid #b98a65;
    border-radius: 12px 12px 12px 3px;
    background: #f5e3d4;
    color: #7c3f40;
    font-size: 1.25rem;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.48);
}
.combat-intro-panel h1 {
    margin: 0;
    color: var(--sheet-ink);
    font-family: var(--font-serif);
    font-size: 1.35rem;
}
.combat-intro-panel :deep(.c-eyebrow) {
    margin-bottom: 4px;
    font-size: 0.62rem;
}
.combat-tab .c-sheet-section:not(.combat-intro-panel) {
    min-width: 0;
}
.combat-intro-mark {
    border-color: #bd9a61;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.5),
        0 2px 5px rgba(83, 59, 38, 0.06);
}
.combat-intro-panel {
    border-color: #c4a474;
    background: linear-gradient(135deg, rgba(255, 250, 239, 0.94), rgba(243, 224, 190, 0.78));
}
.combat-intro-panel h1 {
    color: var(--sheet-burgundy);
}
</style>
