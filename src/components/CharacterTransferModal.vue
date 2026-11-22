<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton, NModal, NRadio, NRadioGroup } from 'naive-ui'
import type { ImportedCharacterPlan } from '@/api/characterTransferCompat'

const props = defineProps<{ plan: ImportedCharacterPlan }>()
const emit = defineEmits<{
    close: []
    confirm: [mode: 'add' | 'replace']
}>()
const mode = ref<'add' | 'replace'>('add')
watch(() => props.plan, () => { mode.value = 'add' })
</script>

<template>
    <NModal :show="true" :on-close="() => emit('close')">
        <section class="mx-3 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-amber-900/30 bg-amber-50 p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
            <h2 id="transfer-title" class="text-xl font-semibold">Проверка импорта</h2>
            <p class="mt-2">Будет добавлено записей: {{ plan.characters.length }} персонажей и {{ plan.npcs.length }} НПС.</p>
            <ul class="mt-3 max-h-48 space-y-1 overflow-y-auto">
                <li v-for="(item, index) in plan.characters" :key="`character-${item.id}`">
                    {{ index + 1 }}. {{ item.character.identity.name || item.character.identity.class || 'Новый персонаж' }} · уровень {{ item.character.identity.level }}
                </li>
                <li v-for="item in plan.npcs" :key="`npc-${item.id}`">
                    НПС: {{ item.character.npc?.name || item.character.identity.name || 'Новый НПС' }}
                </li>
            </ul>
            <p class="mt-3 text-sm">При совпадении ID запись будет добавлена под новым ID; исходные сохранения не перезаписываются.</p>
            <NRadioGroup v-model:value="mode" class="mt-4 flex flex-col gap-2" aria-label="Режим импорта">
                <NRadio value="add">Добавить как новые записи</NRadio>
                <NRadio value="replace" :disabled="!plan.characters.length">Заменить текущего персонажа первой записью</NRadio>
            </NRadioGroup>
            <div class="mt-5 flex flex-wrap justify-end gap-2">
                <NButton @click="emit('close')">Отмена</NButton>
                <NButton type="primary" @click="emit('confirm', mode)">Импортировать</NButton>
            </div>
        </section>
    </NModal>
</template>
