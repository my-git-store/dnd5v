<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NFormItem, NSelect } from 'naive-ui'

interface CharacterOption { id: string; name: string; className: string; ruleset: string }
interface NpcOption { id: string; name: string }

const props = defineProps<{
    characters: CharacterOption[]
    activeId: string | null
    npcs: NpcOption[]
    activeNpcId: string | null
    characterDirty: boolean
    npcDirty: boolean
    allowNpcs: boolean
    allowTransfer: boolean
}>()

const emit = defineEmits<{
    selectCharacter: [id: string]
    createCharacter: []
    copyCharacter: []
    deleteCharacter: []
    exportCharacter: []
    exportAll: []
    importFile: [file: File]
    selectNpc: [id: string]
    createNpc: []
    copyNpc: []
    deleteNpc: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const characterOptions = computed(() => props.characters.map(record => ({
    label: `${record.name} · ${record.className} · ${record.ruleset}`,
    value: record.id,
})))
const npcOptions = computed(() => props.npcs.map(record => ({ label: record.name, value: record.id })))

function acceptFile(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) emit('importFile', file)
    input.value = ''
}
</script>

<template>
    <section class="rounded-xl border border-amber-900/20 bg-amber-50/90 p-4" aria-label="Внутреннее управление сохранениями">
        <div class="grid gap-4 lg:grid-cols-2">
            <div class="grid content-start gap-3">
                <h2 class="font-semibold">Внутренняя коллекция персонажей</h2>
                <NFormItem label="Активный лист" :show-feedback="false">
                    <NSelect
                        :value="activeId"
                        :options="characterOptions"
                        :disabled="!characters.length"
                        aria-label="Выбрать активного персонажа"
                        @update:value="emit('selectCharacter', $event)"
                    />
                </NFormItem>
                <p v-if="characterDirty" class="text-sm" role="status">Есть несохранённые изменения.</p>
                <div class="flex flex-wrap gap-2">
                    <NButton type="primary" @click="emit('createCharacter')">Создать персонажа</NButton>
                    <NButton :disabled="!activeId" @click="emit('copyCharacter')">Копировать</NButton>
                    <NButton type="error" :disabled="!activeId" @click="emit('deleteCharacter')">Удалить</NButton>
                    <template v-if="allowTransfer">
                        <NButton :disabled="!activeId" @click="emit('exportCharacter')">Экспорт</NButton>
                        <NButton :disabled="!characters.length && !npcs.length" @click="emit('exportAll')">Экспорт всех</NButton>
                        <NButton @click="fileInput?.click()">Импорт</NButton>
                        <input ref="fileInput" class="sr-only" type="file" accept="application/json,.json" aria-label="Выбрать файл импорта" @change="acceptFile" />
                    </template>
                </div>
            </div>
            <div v-if="allowNpcs" class="grid content-start gap-3">
                <h2 class="font-semibold">Отдельные записи НПС</h2>
                <NFormItem label="Активный НПС" :show-feedback="false">
                    <NSelect
                        :value="activeNpcId"
                        :options="npcOptions"
                        :disabled="!npcs.length"
                        aria-label="Выбрать НПС"
                        @update:value="emit('selectNpc', $event)"
                    />
                </NFormItem>
                <p v-if="npcDirty" class="text-sm" role="status">Есть несохранённые изменения в листе НПС.</p>
                <div class="flex flex-wrap gap-2">
                    <NButton type="primary" @click="emit('createNpc')">Новый НПС</NButton>
                    <NButton :disabled="!activeNpcId" @click="emit('copyNpc')">Копировать НПС</NButton>
                    <NButton type="error" :disabled="!activeNpcId" @click="emit('deleteNpc')">Удалить НПС</NButton>
                </div>
            </div>
        </div>
    </section>
</template>
