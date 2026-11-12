<script setup lang="ts">
import type { CharacterIdentityPatch, CharacterSheetView } from '@/types/characterView'

type Emits = {
    update: [patch: CharacterIdentityPatch]
}

type Props = {
    character: CharacterSheetView
    disabled?: boolean
}

defineProps<Props>()

const emit = defineEmits<Emits>()

function update(key: Exclude<keyof CharacterIdentityPatch, 'gender'>, value: unknown) {
    if (key === 'level' || key === 'experience') {
        const parsed = Number(value)

        const integer = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
        emit('update', {
            [key]: key === 'level' ? Math.min(20, Math.max(1, integer)) : Math.max(0, integer),
        })
        return
    }
    emit('update', { [key]: String(value ?? '') } as CharacterIdentityPatch)
}
</script>

<template>
    <div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <NFormItem label="Имя" :show-feedback="false">
                <NInput
                    :disabled="disabled"
                    :value="character.name"
                    :input-props="{ 'aria-label': 'Имя' }"
                    @update:value="update('name', $event)"
                />
            </NFormItem>
            <NFormItem label="Вид" :show-feedback="false">
                <NInput
                    :disabled="disabled"
                    :value="character.race.name"
                    :input-props="{ 'aria-label': 'Вид' }"
                    @update:value="update('raceName', $event)"
                />
            </NFormItem>
            <NFormItem label="Класс" :show-feedback="false">
                <NInput
                    :disabled="disabled"
                    :value="character.class"
                    :input-props="{ 'aria-label': 'Класс' }"
                    @update:value="update('className', $event)"
                />
            </NFormItem>
            <NFormItem label="Подкласс" :show-feedback="false">
                <NInput
                    :disabled="disabled"
                    :value="character.subclass"
                    :input-props="{ 'aria-label': 'Подкласс' }"
                    @update:value="update('subclass', $event)"
                />
            </NFormItem>
            <NFormItem label="Мировоззрение" :show-feedback="false">
                <NInput
                    :disabled="disabled"
                    :value="character.alignment"
                    :input-props="{ 'aria-label': 'Мировоззрение' }"
                    @update:value="update('alignment', $event)"
                />
            </NFormItem>
            <NFormItem label="Уровень" :show-feedback="false">
                <NInputNumber
                    button-placement="both"
                    :min="1"
                    :max="20"
                    :step="1"
                    :disabled="disabled"
                    :value="character.level"
                    :input-props="{ 'aria-label': 'Уровень' }"
                    @update:value="update('level', $event)"
                />
            </NFormItem>
            <NFormItem label="Опыт" :show-feedback="false">
                <NInputNumber
                    button-placement="both"
                    :min="0"
                    :step="1"
                    :disabled="disabled"
                    :value="character.experience"
                    :input-props="{ 'aria-label': 'Опыт' }"
                    @update:value="update('experience', $event)"
                />
            </NFormItem>
        </div>
    </div>
</template>
