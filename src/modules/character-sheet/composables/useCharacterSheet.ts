import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createCharacterSheetAdapter } from '../adapters/characterSheetAdapter'
import { type AbilityKey, type CharacterBio, type CharacterDetails, type CharacterMoney, type CharacterSpell } from '../types/character'
import { cloneCharacterView, type CharacterIdentityPatch, type CharacterSavingThrowPatch, type CharacterSheetView, type CharacterSkillPatch } from '../types/characterView'
import type { CharacterCombatV3, CharacterFeatV3, CharacterInventoryItemV3, CharacterPersonalityV3, CharacterSpellcastingV3, CharacterV3 } from '../types/characterV3'
import { validateCharacter } from '../validation/characterValidation'
import { applyCharacterCreation, type CharacterCreationPayload } from '../domain/characterCreation'
import { levelUpProgression, progressionAtLevel } from '../domain/characterProgression'
import { listStoredCharacterIds, listStoredCharacterSummaries, readStoredActiveCharacterId, removeStoredCharacter, writeStoredActiveCharacterId, writeStoredCharacterV3, type StoredCharacterSummary } from '../api/characterV3Storage'
import { uniqueCharacterId } from '../api/characterTransfer'
import { createDefaultNpcProfile } from '../domain/npc'
import { changeSpellSlot, restoreSpellSlots, takeLongRest, takeShortRest, type ShortRestResult } from '../domain/rest'
import type { CharacterV3SpellLevel } from '../types/characterV3'

export function useCharacterSheet(id = 'demo-character') {
  const adapter = createCharacterSheetAdapter()
  const storedActiveId = readStoredActiveCharacterId()
  const activeId = ref<string | null>(storedActiveId === undefined ? id : storedActiveId)
  const characters = ref<StoredCharacterSummary[]>([])
  const suppressVirtualCharacter = ref(false)
  const character = ref<CharacterSheetView | null>(null)
  const savedCharacter = ref<CharacterSheetView | null>(null)
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)
  const savedNotice = ref(false)
  const isDirty = computed(() => character.value !== null && savedCharacter.value !== null && JSON.stringify(character.value) !== JSON.stringify(savedCharacter.value))

  let unloadHandler: ((event: BeforeUnloadEvent) => void) | undefined

  function refreshCharacters() {
    const stored = listStoredCharacterSummaries()
    if (!suppressVirtualCharacter.value && character.value && !stored.some((entry) => entry.id === character.value?.id)) {
      stored.unshift({ id: character.value.id, name: character.value.name, className: character.value.class, ruleset: character.value.ruleset, kind: character.value.kind === 'npc' ? 'npc' : 'character' })
    }
    characters.value = stored
  }

  async function load(nextId = activeId.value ?? id) {
    activeId.value = nextId
    isLoading.value = true
    loadError.value = null
    savedNotice.value = false
    try {
      const result = await adapter.load(nextId)
      character.value = cloneCharacterView(result)
      savedCharacter.value = cloneCharacterView(result)
      savedNotice.value = true
      writeStoredActiveCharacterId(nextId)
      suppressVirtualCharacter.value = false
      refreshCharacters()
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
      suppressVirtualCharacter.value = false
      refreshCharacters()
      writeStoredActiveCharacterId(result.id)
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : 'Не удалось сохранить персонажа.'
    } finally {
      isSaving.value = false
    }
  }

  function newCharacterId() {
    const uuid = globalThis.crypto?.randomUUID?.()
    return uuid ? `character-${uuid}` : `character-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  async function createCharacter() {
    const nextId = newCharacterId()
    suppressVirtualCharacter.value = false
    await load(nextId)
    await save()
    return nextId
  }

  async function createNpc() {
    const nextId = newCharacterId()
    suppressVirtualCharacter.value = false
    await load(nextId)
    if (character.value) {
      character.value.kind = 'npc'
      character.value.name = 'Новый НПС'
      character.value.npc = createDefaultNpcProfile()
    }
    await save()
    return nextId
  }

  async function copyCharacter() {
    if (!character.value) return null
    // Persist the source first so copying the initial virtual demo character
    // cannot silently replace it in the character list.
    await save()
    if (!character.value) return null
    const copy = cloneCharacterView(character.value)
    copy.id = newCharacterId()
    copy.name = `${copy.name || 'Новый персонаж'} (копия)`
    character.value = copy
    activeId.value = copy.id
    savedNotice.value = false
    suppressVirtualCharacter.value = false
    await save()
    return copy.id
  }

  async function deleteCharacter(targetId = activeId.value) {
    if (!targetId) return
    removeStoredCharacter(targetId)
    const remaining = listStoredCharacterSummaries().filter((entry) => entry.id !== targetId)
    if (activeId.value === targetId) {
      const next = remaining[0]
      if (next) {
        suppressVirtualCharacter.value = false
        await load(next.id)
      } else {
        activeId.value = null
        writeStoredActiveCharacterId(null)
        character.value = null
        savedCharacter.value = null
        savedNotice.value = false
        suppressVirtualCharacter.value = true
        characters.value = []
      }
    } else {
      refreshCharacters()
    }
  }

  async function selectCharacter(targetId: string) {
    if (!targetId || targetId === activeId.value) return
    suppressVirtualCharacter.value = false
    await load(targetId)
  }

  async function importCharacters(imported: CharacterV3[], mode: 'add' | 'replace'): Promise<string[]> {
    const usedIds = new Set(listStoredCharacterIds())
    const ids: string[] = []
    for (const [index, importedCharacter] of imported.entries()) {
      const next = JSON.parse(JSON.stringify(importedCharacter)) as CharacterV3
      const targetId = mode === 'replace' && index === 0 && activeId.value ? activeId.value : uniqueCharacterId(next.id, usedIds)
      next.id = targetId
      writeStoredCharacterV3(next)
      usedIds.add(targetId)
      ids.push(targetId)
    }
    const active = ids[0]
    if (active) await load(active)
    return ids
  }

  function updateIdentity(patch: CharacterIdentityPatch) {
    if (!character.value) return
    if (patch.name !== undefined) character.value.name = patch.name
    if (patch.raceName !== undefined) character.value.race.name = patch.raceName
    if (patch.className !== undefined) character.value.class = patch.className
    if (patch.subclass !== undefined) character.value.subclass = patch.subclass
    if (patch.backgroundName !== undefined) character.value.background.name = patch.backgroundName
    if (patch.alignment !== undefined) character.value.alignment = patch.alignment
    if (patch.level !== undefined) {
      character.value.level = patch.level
      if (character.value.progression) character.value.progression = progressionAtLevel(character.value.progression, patch.level)
    }
    if (patch.experience !== undefined) character.value.experience = patch.experience
    if (patch.gender !== undefined && character.value.creation) character.value.creation.gender = patch.gender
    savedNotice.value = false
  }
  function updateNpc(npc: NonNullable<CharacterSheetView['npc']>) {
    if (!character.value) return
    character.value.kind = 'npc'
    character.value.name = npc.name
    character.value.npc = JSON.parse(JSON.stringify(npc)) as NonNullable<CharacterSheetView['npc']>
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
  function shortRest(dice: number): ShortRestResult | null {
    if (!character.value) return null
    const result = takeShortRest(character.value.combat, character.value.abilities, dice)
    character.value.combat = result.combat
    savedNotice.value = false
    saveError.value = null
    return result
  }
  function longRest() {
    if (!character.value) return
    character.value.combat = takeLongRest(character.value.combat)
    character.value.spellcasting = { ...character.value.spellcasting, spellSlots: restoreSpellSlots(character.value.spellcasting.spellSlots) }
    savedNotice.value = false
    saveError.value = null
  }
  function adjustSpellSlot(level: CharacterV3SpellLevel, delta: number) {
    if (!character.value) return
    character.value.spellcasting = { ...character.value.spellcasting, spellSlots: changeSpellSlot(character.value.spellcasting.spellSlots, level, delta) }
    savedNotice.value = false
    saveError.value = null
  }
  function useInventoryItem(id: string): boolean {
    const item = character.value?.inventoryData.items.find((entry) => entry.id === id)
    if (!item || item.quantity <= 0) return false
    item.quantity -= 1
    if (character.value) character.value.inventory = character.value.inventoryData.items.map(({ id: itemId, name, quantity, description }) => ({ id: itemId, name, quantity, description }))
    savedNotice.value = false
    saveError.value = null
    return true
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
  function updateFeats(feats: CharacterFeatV3[]) {
    if (!character.value) return
    character.value.feats = JSON.parse(JSON.stringify(feats)) as CharacterFeatV3[]
    savedNotice.value = false
  }
  function updateBio(bio: CharacterBio) {
    if (!character.value) return
    character.value.bio = { ...bio }
    character.value.personality = { ...character.value.personality, biography: bio.biography, traits: bio.traits, features: bio.features }
    savedNotice.value = false
  }
  function levelUp() {
    if (!character.value?.progression) return
    const nextLevel = character.value.level + 1
    character.value.progression = levelUpProgression(character.value.progression, nextLevel, character.value.ruleset)
    character.value.features = [...character.value.progression.features]
    character.value.level = nextLevel
    savedNotice.value = false
    saveError.value = null
  }
  function applyCreation(payload: CharacterCreationPayload) {
    if (!character.value) return
    character.value = applyCharacterCreation(character.value, payload)
    savedNotice.value = false
    saveError.value = null
  }

  onMounted(() => {
    if (activeId.value === null) {
      suppressVirtualCharacter.value = true
      isLoading.value = false
      refreshCharacters()
    } else {
      void load()
    }
    unloadHandler = (event) => {
      if (!isDirty.value) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', unloadHandler)
  })
  onBeforeUnmount(() => { if (unloadHandler) window.removeEventListener('beforeunload', unloadHandler) })

  return { character, activeId, characters, isLoading, loadError, isSaving, saveError, savedNotice, isDirty, load, save, createCharacter, createNpc, copyCharacter, deleteCharacter, selectCharacter, importCharacters, updateIdentity, updateNpc, updateDetails, updateAbility, updateSkill, updateSavingThrow, updateCombat, updateAttacks, updateSpells, updateCantrips, updateSpellcasting, shortRest, longRest, adjustSpellSlot, useInventoryItem, updateInventory, updateMoney, updatePersonality, updateFeats, updateBio, levelUp, applyCreation }
}
