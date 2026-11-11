<script setup lang="ts">
import { proficiencyBonus } from '@/domain/proficiencyBonus'
import { signedModifier } from '@/domain/abilityModifier'
import type { CharacterRuleset } from '@/types/character'

type Emits = {
    save: []
    'open-details': []
    print: []
}

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

const emit = defineEmits<Emits>()

function hideBrokenAsset(event: Event) {
    const image = event.currentTarget as HTMLImageElement | null
    if (image) {
        image.hidden = true
        image.parentElement
            ?.querySelector<HTMLElement>('[data-asset-fallback]')
            ?.removeAttribute('hidden')
    }
}
</script>
<template>
    <header class="sheet-header">
        <div>
            <h1 class="sheet-character-name">{{ name || 'Безымянный герой' }}</h1>
            <dl class="header-summary">
                <div class="header-species-entry">
                    <dt>Раса</dt>
                    <dd class="header-species-value">
                        <span class="species-avatar" aria-hidden="true"
                            ><span data-asset-fallback :hidden="Boolean(speciesIcon)">{{
                                race?.slice(0, 1) || '✦'
                            }}</span
                            ><img
                                v-if="speciesIcon"
                                :src="speciesIcon"
                                class="species-avatar-image"
                                alt=""
                                @error="hideBrokenAsset" /></span
                        ><span>{{ race || 'Не заполнено' }}</span>
                    </dd>
                </div>
                <div class="header-class-entry">
                    <dt>Класс</dt>
                    <dd class="header-class-value">
                        <span class="class-avatar" aria-hidden="true"
                            ><span data-asset-fallback :hidden="Boolean(classIcon)">{{
                                className?.slice(0, 1) || '✦'
                            }}</span
                            ><img
                                v-if="classIcon"
                                :src="classIcon"
                                class="class-avatar-image"
                                alt=""
                                @error="hideBrokenAsset" /></span
                        ><span>{{ className || 'Не выбран' }}</span>
                    </dd>
                </div>
                <div class="header-background-entry">
                    <dt>Предыстория</dt>
                    <dd class="header-background-value">
                        <span class="background-avatar" aria-hidden="true"
                            ><span data-asset-fallback :hidden="Boolean(backgroundIcon)">{{
                                backgroundName?.slice(0, 1) || '✦'
                            }}</span
                            ><img
                                v-if="backgroundIcon"
                                :src="backgroundIcon"
                                class="background-avatar-image"
                                alt=""
                                @error="hideBrokenAsset" /></span
                        ><span>{{ backgroundName || 'Не выбрана' }}</span>
                    </dd>
                </div>
                <div>
                    <dt>Уровень</dt>
                    <dd>{{ level }}</dd>
                </div>
                <div>
                    <dt>Опыт</dt>
                    <dd>{{ experience }}</dd>
                </div>
                <div>
                    <dt>Бонус владения</dt>
                    <dd>
                        {{
                            proficiencyBonus(level) === null
                                ? '—'
                                : signedModifier(proficiencyBonus(level)!)
                        }}
                    </dd>
                </div>
                <div>
                    <dt>Редакция</dt>
                    <dd>{{ ruleset === '2024' ? 'D&D 2024 / 5.5' : 'D&D 2014' }}</dd>
                </div>
            </dl>
            <p v-if="saveError" class="c-status-text error" role="alert">{{ saveError }}</p>
            <p v-else-if="saving" class="c-status-text pending" role="status" aria-live="polite">
                Сохраняется…
            </p>
            <p v-else-if="dirty" class="c-status-text warning" role="status" aria-live="polite">
                Есть несохранённые изменения
            </p>
            <p v-else-if="saved" class="c-status-text success" role="status" aria-live="polite">
                Сохранено
            </p>
        </div>
        <div class="sheet-header-actions">
            <NButton
                class="header-details-button"
                type="default"
                :disabled="saving"
                @click="emit('open-details')"
                >Сведения</NButton
            >
            <NButton
                class="header-print-button"
                type="default"
                :disabled="saving"
                @click="emit('print')"
                >Печать листа</NButton
            >
            <NButton
                class="sheet-save-button"
                :class="{ 'sheet-save-button-saved': saved }"
                type="primary"
                :loading="saving"
                :disabled="!dirty"
                @click="emit('save')"
                >{{ saved ? 'Сохранено' : 'Сохранить' }}</NButton
            >
        </div>
    </header>
</template>

<style scoped>
.sheet-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
    padding: 24px 26px 22px;
    position: relative;
    background: linear-gradient(135deg, rgba(255, 251, 240, 0.95), rgba(250, 235, 205, 0.82));
    border: 1px solid var(--sheet-line);
    border-radius: 18px;
    box-shadow:
        0 10px 26px rgba(83, 59, 38, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.sheet-header::before,
.sheet-header::after {
    content: '';
    position: absolute;
    left: 24px;
    right: 24px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(155, 106, 47, 0.48), transparent);
}
.sheet-header::before {
    top: 10px;
}
.sheet-header::after {
    bottom: 10px;
}
.sheet-header > div:first-child {
    flex: 1;
    max-width: 680px;
    min-width: 0;
}
.sheet-header-actions {
    display: flex;
    align-items: flex-start;
    flex: 0 0 auto;
    gap: 8px;
    margin-top: 4px;
}
.sheet-header-actions :deep(.n-button) {
    flex: 0 0 auto;
}
.header-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    margin: 14px 0 0;
}
.header-summary div {
    display: grid;
    gap: 2px;
    min-width: 72px;
}
.header-summary dt {
    color: var(--sheet-faded);
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}
.header-summary dd {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 700;
    overflow-wrap: anywhere;
}
.header-class-entry {
    min-width: 120px !important;
}
.header-class-value {
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
}
.header-species-entry {
    min-width: 120px !important;
}
.header-species-value {
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
}
.header-background-entry {
    min-width: 140px !important;
}
.header-background-value {
    display: inline-flex !important;
    align-items: center;
    gap: 8px;
}
.species-avatar {
    display: inline-grid;
    place-items: center;
    position: relative;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border: 1px solid #b99967;
    border-radius: 50%;
    background: #f5e5c4;
    color: #704b25;
    font-family: var(--font-serif);
    font-size: 1.1rem;
    font-weight: 800;
}
.species-avatar-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.class-avatar {
    display: inline-grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border: 1px solid #b99967;
    border-radius: 50%;
    background: #f5e5c4;
    color: #704b25;
    font-family: var(--font-serif);
    font-size: 1.1rem;
    font-weight: 800;
}
.class-avatar-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.background-avatar {
    display: inline-grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border: 1px solid #b99967;
    border-radius: 50%;
    background: #f5e5c4;
    color: #704b25;
    font-family: var(--font-serif);
    font-size: 1.1rem;
    font-weight: 800;
}
.background-avatar-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.sheet-header {
    padding: 23px 25px 21px;
    border-color: #b99a69;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(255, 251, 240, 0.94), rgba(247, 229, 195, 0.82));
    box-shadow:
        0 8px 22px rgba(83, 59, 38, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.72);
}
.sheet-header::before,
.sheet-header::after {
    background: linear-gradient(
        90deg,
        transparent,
        rgba(122, 62, 67, 0.5),
        rgba(196, 155, 92, 0.65),
        transparent
    );
}
.sheet-character-name {
    margin: 0;
    color: #3e2c1c;
    font-family: var(--font-serif);
    font-size: clamp(1.35rem, 2.5vw, 1.95rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.02em;
    overflow-wrap: anywhere;
}
.header-summary {
    gap: 8px 11px;
}
.header-summary div {
    min-width: 84px;
    padding: 7px 11px;
    border-left: 2px solid rgba(196, 155, 92, 0.42);
    background: rgba(255, 249, 233, 0.44);
}
.header-summary dt {
    color: #8d6a40;
}
.header-summary dd {
    color: #49331f;
    font-family: var(--font-serif);
}
.c-character-sheet .sheet-save-button-saved {
    border-color: rgba(63, 112, 73, 0.28);
    background: #edf5eb;
    color: var(--sheet-success);
    box-shadow: 0 4px 10px rgba(63, 112, 73, 0.16);
}
.c-character-sheet .sheet-save-button.is-disabled {
    opacity: 1;
}
.c-character-sheet .sheet-save-button:disabled {
    box-shadow: none;
}
</style>
