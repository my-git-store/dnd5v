<script setup lang="ts">
import { computed } from 'vue'
import { NButton } from 'naive-ui'
import { useCharacterSheet } from '@/composables/useCharacterSheet'
import { useModalUtil } from '@/composables/useModal'
import { ABILITY_FIELDS } from '@/data/characterFields'
import { formatAttackBonus } from '@/domain/attackBonus'
import AttackEditorModal from './AttackEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterAttackRecord } from '@/types/character'

const { character } = useCharacterSheet()

const editorModal = useModalUtil<CharacterAttackRecord, undefined>()

const kindLabels: Record<CharacterAttackRecord['kind'], string> = {
    melee: 'Ближняя',
    ranged: 'Дальняя',
    spell: 'Заклинание',
    other: 'Другое',
}

const attacks = computed(() => {
    const currentCharacter = character.value
    if (!currentCharacter) return []

    return currentCharacter.attacks.map(attack => ({
        attack,
        abilityLabel: ABILITY_FIELDS.find(field => field.key === attack.ability)?.label,
        bonus: formatAttackBonus(
            attack,
            currentCharacter.abilities,
            currentCharacter.identity.level,
        ),
    }))
})

function removeAttack(id: string) {
    if (!character.value) return
    character.value.attacks = character.value.attacks.filter(attack => attack.id !== id)
}

function openEditor(attack: CharacterAttackRecord) {
    editorModal.item.value = { ...attack }
    editorModal.openOrClose()
}

function add() {
    openEditor({
        id: `attack-${Date.now()}`,
        name: '',
        kind: 'other',
        ability: null,
        proficient: false,
        additionalBonus: 0,
        damage: 0,
        damageType: '',
        range: 0,
        description: '',
    })
}
</script>

<template>
    <section v-if="character">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <h2>Атаки</h2>
            <NButton type="default" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="character.attacks.length === 0" text="Атак пока нет." />
        <div
            v-for="{ attack, abilityLabel, bonus } in attacks"
            :key="attack.id"
            class="py-3 flex flex-wrap items-start justify-between gap-3"
        >
            <div class="min-w-0">
                <h3>{{ attack.name || 'Без названия' }}</h3>
                <div class="flex flex-wrap items-center gap-2">
                    <span>{{ kindLabels[attack.kind] }}</span>
                    <span v-if="abilityLabel">{{ abilityLabel }}</span>
                    <span>{{ attack.proficient ? 'Владение' : 'Без владения' }}</span>
                </div>
                <div>
                    <span>Атака</span><strong>{{ bonus }}</strong>
                </div>
                <div>
                    <span>Урон</span><strong>{{ attack.damage }}</strong>
                    <small>{{ attack.damageType || 'Тип не указан' }}</small>
                </div>
                <div>
                    <span>Дальность</span><strong>{{ attack.range }}</strong>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span v-if="attack.description" :title="attack.description">
                        {{ attack.description }}
                    </span>
                </div>
            </div>
            <EntryActions @edit="openEditor(attack)" @remove="removeAttack(attack.id)" />
        </div>
        <AttackEditorModal
            v-if="editorModal.isShowModal.value && editorModal.item.value"
            :attack="editorModal.item.value"
            @close="editorModal.openOrClose"
        />
    </section>
</template>
