<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { classIconFor } from '@/data/classIcons'

import { spellProgressionLabel } from '../../utils/creationLabels'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<CharacterCreationModel, 'classOptions' | 'classId' | 'gender' | 'skillLabels'>
    >
    disabled?: boolean
}
type Emits = {
    selectClass: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { classOptions, classId, gender, skillLabels } = toRefs(props.model)
</script>

<template>
    <div class="grid gap-4">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Выберите класс">
            <NButton
                v-for="item in classOptions"
                :key="item.id"
                :type="classId === item.id ? 'primary' : 'default'"
                native-type="button"
                class="h-auto! whitespace-normal!"
                :aria-pressed="classId === item.id"
                :disabled="disabled"
                @click="emit('selectClass', item.id)"
            >
                <span class="flex w-full items-center justify-between gap-2"
                    ><span
                        class="inline-flex size-24 shrink-0 items-center justify-center"
                        aria-hidden="true"
                        ><img
                            v-if="classIconFor(item.id, gender)"
                            :src="classIconFor(item.id, gender)"
                            class="size-full object-contain"
                            :alt="`Иллюстрация класса «${item.label}» (${gender === 'male' ? 'мужской' : 'женский'} вариант)`"
                            loading="lazy"
                        /><span v-else>{{ item.hitDie }}</span></span
                    ><span v-if="classId === item.id" aria-label="Выбрано">✓</span></span
                ><strong>{{ item.label }}</strong
                ><span>{{
                    item.description
                        ? `${item.description} Основная характеристика: ${ABILITY_FIELDS.find(field => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}`
                        : `Основная характеристика: ${ABILITY_FIELDS.find(field => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}`
                }}</span
                ><span>Особенности: {{ item.features.join(' · ') }}</span
                ><span
                    >Спасброски:
                    {{
                        item.savingThrowKeys
                            .map(
                                key =>
                                    ABILITY_FIELDS.find(field => field.key === key)?.label ?? key,
                            )
                            .join(' · ')
                    }}</span
                ><span
                    >Навыки:
                    {{ item.skillOptions.map(id => skillLabels[id] ?? id).join(' · ') }}
                    · выбрать {{ item.skillChoiceCount }}</span
                ><span v-if="item.weaponProficiencies?.length"
                    >Оружие: {{ item.weaponProficiencies.join(' · ') }}</span
                ><span v-if="item.armorProficiencies?.length"
                    >Броня: {{ item.armorProficiencies.join(' · ') }}</span
                ><span v-if="item.startingEquipment?.length"
                    >Снаряжение:
                    {{ item.startingEquipment.map(kit => kit.label).join(' · ') }}</span
                ><span>{{
                    item.spellProgressionType !== 'none'
                        ? `Магия: ${spellProgressionLabel(item.spellProgressionType)}`
                        : 'Без заклинаний на этом шаге'
                }}</span>
            </NButton>
        </div>
    </div>
</template>
