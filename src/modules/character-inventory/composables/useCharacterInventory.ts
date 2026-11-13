import { useCharacterSheet } from '@/composables/useCharacterSheet'
import type { CharacterInventoryItemRecord, CharacterMoney } from '@/types/character'

export function useCharacterInventory() {
    const { character } = useCharacterSheet()

    function updateInventory(items: CharacterInventoryItemRecord[]) {
        if (character.value) character.value.inventory.items = items
    }

    function updateMoney(money: CharacterMoney) {
        if (character.value) character.value.inventory.money = money
    }

    return {
        updateInventory,
        updateMoney,
    }
}
