<script setup lang="ts">
import type { CharacterMoney } from '@/types/character'
const props = defineProps<{ money: CharacterMoney; disabled?: boolean }>()

const emit = defineEmits<{ update: [money: CharacterMoney] }>()

const fields: Array<{ key: keyof CharacterMoney; label: string }> = [
    { key: 'copper', label: 'Медь' },
    { key: 'silver', label: 'Серебро' },
    { key: 'electrum', label: 'Электрум' },
    { key: 'gold', label: 'Золото' },
    { key: 'platinum', label: 'Платина' },
]

function update(key: keyof CharacterMoney, value: unknown) {
    const amount = Math.max(0, Math.trunc(Number(value) || 0))
    emit('update', { ...props.money, [key]: amount })
}
</script>
<template>
    <section class="c-sheet-section">
        <h2>Деньги</h2>
        <div class="money-grid">
            <div v-for="field in fields" :key="field.key">
                <NFormItem :label="field.label"
                    ><NInputNumber
                        min="0"
                        :value="money[field.key]"
                        :disabled="disabled"
                        @update:value="update(field.key, $event)"
                /></NFormItem>
            </div>
        </div>
    </section>
</template>

<style scoped>
.money-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(5, minmax(0, 1fr));
}
.money-grid {
    grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
}
.money-grid > div {
    min-width: 0;
}
.money-grid :deep(label) {
    overflow-wrap: normal;
    word-break: normal;
    white-space: nowrap;
}
</style>
