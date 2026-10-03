import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createCharacterSheetAdapter } from '../adapters/characterSheetAdapter'
import { type AbilityKey, type CharacterBio, type CharacterDetails, type CharacterMoney, type CharacterSpell } from '../types/character'
import { cloneCharacterView, type CharacterIdentityPatch, type CharacterSavingThrowPatch, type CharacterSheetView, type CharacterSkillPatch } from '../types/characterView'
import type { CharacterCombatV3, CharacterInventoryItemV3, CharacterPersonalityV3, CharacterSpellcastingV3 } from '../types/characterV3'
import { validateCharacter } from '../validation/characterValidation'
import { applyCharacterCreation, type CharacterCreationPayload } from '../domain/characterCreation'

export function useCharacterSheet(id = 'demo-character') {
  const adapter = createCharacterSheetAdapter()
  const character = ref<CharacterSheetView | null>(null)
  const savedCharacter = ref<CharacterSheetView | null>(null)
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
      const result = await adapter.load(id)
      character.value = cloneCharacterView(result)
      savedCharacter.value = cloneCharacterView(result)
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
      const result = await adapter.save(character.value)
      character.value = cloneCharacterView(result)
      savedCharacter.value = cloneCharacterView(result)
      savedNotice.value = true
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Не удалось сохранить персонажа.'
    } finally {
      isSaving.value = false
    }
  }

  function updateName(name: string) { if (character.value) character.value.name = name; savedNotice.value = false }
  function updateIdentity(patch: CharacterIdentityPatch) {
    if (!character.value) return
    if (patch.name !== undefined) character.value.name = patch.name
    if (patch.raceName !== undefined) character.value.race.name = patch.raceName
    if (patch.className !== undefined) character.value.class = patch.className
    if (patch.subclass !== undefined) character.value.subclass = patch.subclass
    if (patch.backgroundName !== undefined) character.value.background.name = patch.backgroundName
    if (patch.alignment !== undefined) character.value.alignment = patch.alignment
    if (patch.level !== undefined) character.value.level = patch.level
    if (patch.experience !== undefined) character.value.experience = patch.experience
    savedNotice.value = false
  }
  function updateDetails(details: CharacterDetails) { if (character.value) Object.assign(character.value, details); savedNotice.value = false }
  function updateAbility(key: AbilityKey, value: number) { if (character.value) character.value.abilities[key] = value; savedNotice.value = false }
  function updateSkill(id: string, patch: CharacterSkillPatch) { const item = character.value?.skills.find((skill) => skill.id === id); if (item) Object.assign(item, patch); savedNotice.value = false }
  function updateSavingThrow(key: AbilityKey, patch: CharacterSavingThrowPatch) {
    if (!character.value) return
    Object.assign(character.value.savingThrows[key], patch)
    if (patch.proficient !== undefined && character.value.creation && !character.value.creation.classSavingThrowKeys.includes(key)) {
      const manualKeys = new Set(character.value.creation.manualSavingThrowKeys ?? [])
      if (patch.proficient) manualKeys.add(key)
      else manualKeys.delete(key)
      character.value.creation.manualSavingThrowKeys = [...manualKeys]
    }
    savedNotice.value = false
  }
  function updateCombat(combat: CharacterCombatV3) {
    if (!character.value) return
    character.value.combat = JSON.parse(JSON.stringify(combat)) as CharacterCombatV3
    character.value.armorClass = combat.armorClass.value
    savedNotice.value = false
  }
  function updateAttacks(attacks: CharacterSheetView['attacks']) { if (character.value) character.value.attacks = attacks; savedNotice.value = false }
  function updateSpells(spells: CharacterSpell[]) { if (character.value) character.value.spells = spells; savedNotice.value = false }
  function updateCantrips(cantrips: CharacterSpell[]) { if (character.value) character.value.cantrips = cantrips; savedNotice.value = false }
  function updateSpellcasting(spellcasting: CharacterSpellcastingV3) {
    if (!character.value) return
    character.value.spellcasting = JSON.parse(JSON.stringify(spellcasting)) as CharacterSpellcastingV3
    savedNotice.value = false
  }
  function updateInventory(inventory: CharacterInventoryItemV3[]) {
    if (!character.value) return
    character.value.inventoryData.items = JSON.parse(JSON.stringify(inventory)) as CharacterInventoryItemV3[]
    character.value.inventory = inventory.map(({ id, name, quantity, description }) => ({ id, name, quantity, description }))
    savedNotice.value = false
  }
  function updateMoney(money: CharacterMoney) {
    if (!character.value) return
    character.value.money = { ...money }
    character.value.inventoryData.money = { ...money }
    savedNotice.value = false
  }
  function updatePersonality(personality: CharacterPersonalityV3) {
    if (!character.value) return
    character.value.personality = JSON.parse(JSON.stringify(personality)) as CharacterPersonalityV3
    character.value.bio = { biography: personality.biography, traits: personality.traits, features: personality.features }
    savedNotice.value = false
  }
  function updateBio(bio: CharacterBio) {
    if (!character.value) return
    character.value.bio = { ...bio }
    character.value.personality = { ...character.value.personality, biography: bio.biography, traits: bio.traits, features: bio.features }
    savedNotice.value = false
  }
  function applyCreation(payload: CharacterCreationPayload) {
    if (!character.value) return
    character.value = applyCharacterCreation(character.value, payload)
    savedNotice.value = false
    saveError.value = null
  }

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

  return { character, isLoading, loadError, isSaving, saveError, savedNotice, isDirty, load, save, updateName, updateIdentity, updateDetails, updateAbility, updateSkill, updateSavingThrow, updateCombat, updateAttacks, updateSpells, updateCantrips, updateSpellcasting, updateInventory, updateMoney, updatePersonality, updateBio, applyCreation }
}
