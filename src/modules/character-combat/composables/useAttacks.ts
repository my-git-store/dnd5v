import { computed } from 'vue'

import type { CharacterAttackRecord } from '@/types/character'

export function useAttacks(
    getAttacks: () => CharacterAttackRecord[],
    onUpdate: (attacks: CharacterAttackRecord[]) => void,
) {
    const attacks = computed(getAttacks)

    function createAttackDraft(): CharacterAttackRecord {
        return {
            id: `attack-${Date.now()}`,
            name: '',
            kind: 'other',
            attackBonus: '',
            abilitySource: 'manual',
            proficient: false,
            calculationMode: 'manual',
            additionalBonus: 0,
            damage: '',
            damageType: '',
            properties: [],
            range: '',
            description: '',
            weaponId: undefined,
            masteryId: undefined,
        }
    }

    function saveAttack(attack: CharacterAttackRecord) {
        const exists = attacks.value.some(current => current.id === attack.id)
        onUpdate(
            exists
                ? attacks.value.map(current => (current.id === attack.id ? attack : current))
                : [...attacks.value, attack],
        )
    }

    function removeAttack(id: string) {
        onUpdate(attacks.value.filter(attack => attack.id !== id))
    }

    return {
        attacks,
        createAttackDraft,
        saveAttack,
        removeAttack,
    }
}
