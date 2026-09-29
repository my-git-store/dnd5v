import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getCharacter, saveCharacter } from '../api/characterApi'
import { cloneCharacter, type AbilityKey, type Character, type CharacterAttack, type CharacterBio, type CharacterSpell, type InventoryItem } from '../types/character'
import { validateCharacter } from '../validation/characterValidation'

export function useCharacterSheet(id = 'demo-character') {
  const character = ref<Character | null>(null)
  const savedCharacter = ref<Character | null>(null)
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const savedNotice = ref(false)
  const isDirty = computed(() => character.value !== null && savedCharacter.value !== null && JSON.stringify(character.value) !== JSON.stringify(savedCharacter.value))

  let unloadHandler: ((event: BeforeUnloadEvent) => void) | undefined

  async function load() {
    isLoading.value = true
    loadError.value = null
    savedNotice.value = false
    try {
      const result = await getCharacter(id)
      character.value = cloneCharacter(result)
      savedCharacter.value = cloneCharacter(result)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Не удалось загрузить персонажа.'
    } finally {
      isLoading.value = false
    }
  }

  async function save() {
    if (!character.value || isSaving.value) return
    savedNotice.value = false
    const errors = validateCharacter(character.value)
    if (errors.length) { saveError.value = errors[0] ?? 'Проверьте данные персонажа.'; return }
    isSaving.value = true
    saveError.value = null
    savedNotice.value = false
    try {
      const result = await saveCharacter(character.value)
      character.value = cloneCharacter(result)
      savedCharacter.value = cloneCharacter(result)
      savedNotice.value = true
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Не удалось сохранить персонажа.'
    } finally {
      isSaving.value = false
    }
  }

  function updateName(name: string) { if (character.value) character.value.name = name; savedNotice.value = false }
  function updateAbility(key: AbilityKey, value: number) { if (character.value) character.value.abilities[key] = value; savedNotice.value = false }
  function updateSkill(id: string, value: number) { const item = character.value?.skills.find((skill) => skill.id === id); if (item) item.value = value; savedNotice.value = false }
  function updateAttacks(attacks: CharacterAttack[]) { if (character.value) character.value.attacks = attacks; savedNotice.value = false }
  function updateSpells(spells: CharacterSpell[]) { if (character.value) character.value.spells = spells; savedNotice.value = false }
  function updateCantrips(cantrips: CharacterSpell[]) { if (character.value) character.value.cantrips = cantrips; savedNotice.value = false }
  function updateInventory(inventory: InventoryItem[]) { if (character.value) character.value.inventory = inventory; savedNotice.value = false }
  function updateMoney(money: Character['money']) { if (character.value) character.value.money = money; savedNotice.value = false }
  function updateBio(bio: CharacterBio) { if (character.value) character.value.bio = bio; savedNotice.value = false }

  onMounted(() => {
    void load()
    unloadHandler = (event) => {
      if (!isDirty.value) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', unloadHandler)
  })
  onBeforeUnmount(() => { if (unloadHandler) window.removeEventListener('beforeunload', unloadHandler) })

  return { character, isLoading, loadError, isSaving, saveError, savedNotice, isDirty, load, save, updateName, updateAbility, updateSkill, updateAttacks, updateSpells, updateCantrips, updateInventory, updateMoney, updateBio }
}
