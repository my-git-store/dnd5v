<script setup lang="ts">
import { toRefs } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier'

import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            | 'classSkillsRemaining'
            | 'selectedCount'
            | 'selectedClass'
            | 'selectableSkills'
            | 'isSkillChoiceSelected'
            | 'canSelectSkill'
            | 'currentOwnedSkills'
            | 'finalAbility'
            | 'selectableSkillSource'
        >
    >
    disabled?: boolean
}
type Emits = {
    toggleSkill: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const {
    classSkillsRemaining,
    selectedCount,
    selectedClass,
    selectableSkills,
    isSkillChoiceSelected,
    canSelectSkill,
    currentOwnedSkills,
    finalAbility,
    selectableSkillSource,
} = toRefs(props.model)
</script>

<template>
    <div class="grid gap-4">
        <div>
            <span
                >Выбор навыков: <b>{{ selectedCount }} / {{ selectedClass.skillChoiceCount }}</b
                ><small>{{
                    classSkillsRemaining
                        ? `Осталось выбрать: ${classSkillsRemaining}`
                        : 'Выбор завершён'
                }}</small></span
            >
        </div>
        <div class="grid gap-2">
            <NButton
                v-for="skill in selectableSkills"
                :key="skill.id"
                :type="isSkillChoiceSelected(skill.id) ? 'primary' : 'default'"
                native-type="button"
                class="h-auto! w-full whitespace-normal!"
                :aria-pressed="isSkillChoiceSelected(skill.id)"
                :disabled="
                    disabled || (!isSkillChoiceSelected(skill.id) && !canSelectSkill(skill.id))
                "
                @click="emit('toggleSkill', skill.id)"
            >
                <span class="grid gap-2"
                    ><strong>{{ skill.name }}</strong
                    ><span
                        >{{
                            ABILITY_FIELDS.find(field => field.key === skill.ability)?.label ??
                            'Характеристика не задана'
                        }}
                        · итог
                        {{
                            currentOwnedSkills.find(entry => entry.id === skill.id)?.bonus ??
                            signedModifier(
                                abilityModifier(skill.ability ? finalAbility(skill.ability) : 10),
                            )
                        }}</span
                    ></span
                ><span>{{ selectableSkillSource(skill.id) }}</span
                ><span :aria-label="isSkillChoiceSelected(skill.id) ? 'Выбрано' : undefined">{{
                    isSkillChoiceSelected(skill.id) ? '✓' : ''
                }}</span>
            </NButton>
        </div>
        <p>
            Выберите ровно указанное количество навыков класса и вида. После достижения лимита
            остальные варианты блокируются. Владения складываются по источникам: один навык может
            одновременно происходить от вида, класса и ручной настройки.
        </p>
    </div>
</template>
