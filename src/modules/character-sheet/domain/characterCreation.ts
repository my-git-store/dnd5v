import { cloneCharacterView, type CharacterSheetView } from '../types/characterView.ts'
import type { AbilityKey, CharacterAbilities } from '../types/character.ts'
import type { CharacterCreationV3, CharacterInventoryItemV3, CharacterRuleset, SkillProficiencySource } from '../types/characterV3.ts'
import { combinedRaceBonuses, findBackground, findClass, findRace, findSubrace, raceProfile } from '../data/dnd5eOptions.ts'
import { applyCharacterCreation2024 } from './characterCreation2024.ts'
import { progressionAfterCreation, progressionForClass } from './characterProgression.ts'

const ABILITY_KEYS: readonly AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

export interface CharacterCreationPayload {
  ruleset?: CharacterRuleset
  speciesId?: string
  originFeatId?: string
  originAbilityChoices?: AbilityKey[]
  originAbilityFocus?: AbilityKey
  speciesChoices?: Record<string, string[]>
  name: string
  raceId: string
  subraceId?: string
  classId: string
  backgroundId?: string
  subclass: string
  alignment: string
  baseAbilities: CharacterAbilities
  classSkillIds: string[]
  raceSkillChoices?: string[]
  raceAbilityChoices: AbilityKey[]
  classEquipmentId?: string
  backgroundEquipmentId?: string
}

function unique(values: string[]): string[] { return [...new Set(values)] }

function selectedEquipment(option: { id: string; items: Array<{ name: string; quantity: number; description: string; weight?: number | null; properties?: string[] }> } | undefined, characterId: string, source: 'class' | 'background'): CharacterInventoryItemV3[] {
  if (!option) return []
  return option.items.map((item, index) => ({
    id: `creation:${characterId}:${source}:${option.id}:${index}`,
    name: item.name,
    quantity: item.quantity,
    weight: item.weight ?? null,
    description: item.description,
    equipped: false,
    properties: [...(item.properties ?? [])],
    source: 'creation',
  }))
}

export function applyCharacterCreation(character: CharacterSheetView, payload: CharacterCreationPayload): CharacterSheetView {
  if (payload.ruleset === '2024') return applyCharacterCreation2024(character, payload)
  const next = cloneCharacterView(character)
  const race = findRace(payload.raceId)
  const subrace = findSubrace(race.id, payload.subraceId)
  const classOption = findClass(payload.classId)
  const raceBonuses = combinedRaceBonuses(race, payload.raceAbilityChoices, subrace)
  const previousCreation = next.creation
  const abilityBonusSources = Object.fromEntries(ABILITY_KEYS.map((key) => {
    const preservedFeatSources = (previousCreation?.abilityBonusSources?.[key] ?? []).filter((entry) => entry.source === 'feat')
    return [key, [...preservedFeatSources, ...((raceBonuses[key] ?? 0) === 0 ? [] : [{ source: 'species' as const, amount: raceBonuses[key] ?? 0 }])]]
  })) as CharacterCreationV3['abilityBonusSources']
  const hasBackgroundSelection = payload.backgroundId !== undefined
  const backgroundId = hasBackgroundSelection ? payload.backgroundId : previousCreation?.backgroundId
  const background = backgroundId ? findBackground(backgroundId) : undefined
  const previousClassSavingThrowKeys = previousCreation?.classSavingThrowKeys ?? []
  const previousManualSavingThrowKeys = previousCreation?.manualSavingThrowKeys ?? []
  const classSkillIds = unique(payload.classSkillIds.filter((id) => classOption.skillOptions.includes(id))).slice(0, classOption.skillChoiceCount)
  const raceSkillChoices = unique((payload.raceSkillChoices ?? []).filter((id) => race.skillChoices?.options.includes(id))).slice(0, race.skillChoices?.count ?? 0)
  const raceSkillIds = unique([...(race.skillProficiencies ?? []), ...raceSkillChoices])
  const subraceSkillIds = unique(subrace?.skillProficiencies ?? [])
  const backgroundSkillIds = hasBackgroundSelection
    ? unique(background?.skillProficiencies ?? [])
    : unique(background?.skillProficiencies ?? previousCreation?.backgroundSkillIds ?? next.background.skillProficiencies)
  const oldRaceLanguages = unique([...(previousCreation?.raceLanguages ?? []), ...(previousCreation?.subraceLanguages ?? [])])
  const oldBackgroundLanguages = previousCreation?.backgroundLanguages ?? next.background.languages
  const oldClassProficiencies = previousCreation?.classProficiencies ?? []
  const oldBackgroundTools = previousCreation?.backgroundToolProficiencies ?? next.background.toolProficiencies

  next.name = payload.name.trim() || next.name
  next.ruleset = '2014'
  next.class = classOption.label
  next.subclass = payload.subclass.trim()
  next.alignment = payload.alignment.trim()
  next.race = raceProfile(race, raceBonuses, subrace)
  if (background) next.background = { name: background.label, feature: background.feature, skillProficiencies: [...background.skillProficiencies], toolProficiencies: [...background.toolProficiencies], languages: [...background.languages], notes: background.description }
  else if (hasBackgroundSelection) next.background = { name: '', feature: '', skillProficiencies: [], toolProficiencies: [], languages: [], notes: '' }
  next.abilities = Object.fromEntries(ABILITY_KEYS.map((key) => [key, payload.baseAbilities[key] + (raceBonuses[key] ?? 0)])) as CharacterAbilities

  next.skills = next.skills.map((skill) => {
    const selectedByClass = classSkillIds.includes(skill.id)
    const selectedByRace = raceSkillIds.includes(skill.id) || subraceSkillIds.includes(skill.id)
    const previousSources = skill.proficiencySources ?? (skill.proficiency === 'none' ? [] : ['manual' as SkillProficiencySource])
    const preservedSources = previousSources.filter((source) => source === 'manual' || source === 'feat')
    const nextSources = [...new Set([...preservedSources, ...(selectedByClass ? ['class' as SkillProficiencySource] : []), ...(selectedByRace ? ['race' as SkillProficiencySource] : []), ...(backgroundSkillIds.includes(skill.id) ? ['background' as SkillProficiencySource] : [])])]
    const hasManualSource = previousSources.includes('manual')
    const hasDerivedSource = nextSources.some((source) => source !== 'manual')
    const calculationMode = skill.calculationMode === 'manual' && !hasManualSource && hasDerivedSource && skill.value === 0 && skill.additionalBonus === 0
      ? 'computed' : skill.calculationMode
    return { ...skill, calculationMode, proficiency: skill.proficiency === 'expertise' ? 'expertise' : nextSources.length ? 'proficient' : 'none', proficiencySources: nextSources }
  })

  const newlyManualSavingThrowKeys = ABILITY_KEYS.filter((key) => !previousClassSavingThrowKeys.includes(key) && !previousManualSavingThrowKeys.includes(key) && next.savingThrows[key].proficient)
  const manualSavingThrowKeys = ABILITY_KEYS.filter((key) => next.savingThrows[key].proficient && (previousManualSavingThrowKeys.includes(key) || newlyManualSavingThrowKeys.includes(key)))
  for (const key of ABILITY_KEYS) next.savingThrows[key] = { ...next.savingThrows[key], proficient: manualSavingThrowKeys.includes(key) || classOption.savingThrowKeys.includes(key) }

  const manualLanguages = next.proficiency.languageProficiencies.filter((language) => !oldRaceLanguages.includes(language) && !oldBackgroundLanguages.includes(language))
  const manualTools = next.proficiency.toolProficiencies.filter((tool) => !oldClassProficiencies.includes(tool) && !oldBackgroundTools.includes(tool))
  next.proficiency = {
    ...next.proficiency,
    toolProficiencies: unique([...manualTools, ...classOption.proficiencies, ...(background?.toolProficiencies ?? (hasBackgroundSelection ? [] : oldBackgroundTools))]),
    languageProficiencies: unique([...manualLanguages, ...race.profile.languages, ...(subrace?.languages ?? []), ...(background?.languages ?? (hasBackgroundSelection ? [] : oldBackgroundLanguages))]),
  }
  next.origin = {
    species: next.race.name,
    background: next.background.name,
    originFeat: '',
    languages: unique(next.proficiency.languageProficiencies),
    tools: unique(next.proficiency.toolProficiencies),
  }
  next.combat.speed.base = race.profile.speed
  next.spellcasting.spellRuleset = '2014'
  next.spellcasting.spellcastingAbility = classOption.spellcastingAbility
  next.spellcasting.spellProgressionType = classOption.spellProgressionType ?? (classOption.spellcastingAbility ? 'prepared' : 'none')

  // Older callers did not provide equipment choices; keep that path side-effect free.
  const classEquipment = payload.classEquipmentId ? classOption.equipmentOptions?.find((item) => item.id === payload.classEquipmentId) : undefined
  const backgroundEquipment = payload.backgroundEquipmentId && background ? background.equipmentOptions.find((item) => item.id === payload.backgroundEquipmentId) : undefined
  const equipmentWasSelected = payload.classEquipmentId !== undefined || payload.backgroundEquipmentId !== undefined
  const previousEquipmentIds = new Set(equipmentWasSelected ? (previousCreation?.startingEquipmentIds ?? []) : [])
  const creationPrefix = `creation:${next.id}:`
  const preservedItems = next.inventoryData.items.filter((item) => !(item.source === 'creation' && (previousEquipmentIds.has(item.id) || (equipmentWasSelected && item.id.startsWith(creationPrefix)))))
  const generatedItems = equipmentWasSelected ? [...selectedEquipment(classEquipment, next.id, 'class'), ...selectedEquipment(backgroundEquipment, next.id, 'background')] : []
  next.inventoryData.items = [...preservedItems, ...generatedItems]
  const creation: CharacterCreationV3 = {
    ruleset: '2014',
    raceId: race.id,
    subraceId: subrace?.id,
    classId: classOption.id,
    classLevel: next.level,
    classSources: [{ kind: 'class', id: classOption.id, label: classOption.label }],
    spellProgressionType: classOption.spellProgressionType ?? (classOption.spellcastingAbility ? 'prepared' : 'none'),
    backgroundId: background?.id ?? (hasBackgroundSelection ? undefined : previousCreation?.backgroundId),
    baseAbilityScores: { ...payload.baseAbilities },
    raceSkillIds,
    raceAbilityChoices: [...payload.raceAbilityChoices],
    subraceSkillIds,
    classSkillIds: [...classSkillIds],
    backgroundSkillIds,
    classSavingThrowKeys: [...classOption.savingThrowKeys],
    manualSavingThrowKeys,
    classFeatures: [...classOption.features],
    raceFeatures: [...race.profile.traits, ...(subrace?.traits ?? [])],
    subraceFeatures: [...(subrace?.traits ?? [])],
    classProficiencies: [...classOption.proficiencies],
    backgroundToolProficiencies: [...(background?.toolProficiencies ?? (hasBackgroundSelection ? [] : oldBackgroundTools))],
    abilityBonusSources,
    raceLanguages: [...race.profile.languages],
    subraceLanguages: [...(subrace?.languages ?? [])],
    backgroundLanguages: [...(background?.languages ?? (hasBackgroundSelection ? [] : oldBackgroundLanguages))],
    classEquipmentId: equipmentWasSelected ? classEquipment?.id : previousCreation?.classEquipmentId,
    backgroundEquipmentId: equipmentWasSelected ? backgroundEquipment?.id : previousCreation?.backgroundEquipmentId,
    startingEquipmentIds: equipmentWasSelected ? generatedItems.map((item) => item.id) : previousCreation?.startingEquipmentIds,
  }
  next.creation = creation
  next.progression = progressionAfterCreation(character.progression, progressionForClass({
    ruleset: '2014',
    classId: classOption.id,
    level: next.level,
    choices: {
      classSkills: [...classSkillIds],
      ...(classEquipment?.id ? { classEquipment: [classEquipment.id] } : {}),
      ...(backgroundEquipment?.id ? { backgroundEquipment: [backgroundEquipment.id] } : {}),
    },
  }), character.ruleset, '2014')
  next.features = [...next.progression.features]
  return next
}
