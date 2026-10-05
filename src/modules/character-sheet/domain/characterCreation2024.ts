import { cloneCharacterView, type CharacterSheetView } from '../types/characterView.ts'
import type { AbilityKey } from '../types/character.ts'
import type { CharacterCreationV3, CharacterInventoryItemV3, SkillProficiencySource } from '../types/characterV3.ts'
import { getRules2024Background, getRules2024Class, getRules2024Feat, getSpecies2024 } from '../data/rules2024/index.ts'
import type { CharacterCreationPayload } from './characterCreation.ts'
import { progressionAfterCreation, progressionForClass } from './characterProgression.ts'

const ABILITY_KEYS: readonly AbilityKey[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']
const unique = (values: string[]) => [...new Set(values)]

function selectedSpeciesChoices(species: ReturnType<typeof getSpecies2024>, selected: Record<string, string[]> | undefined): Record<string, string[]> {
  if (!species) return {}
  const entries: Array<[string, string[]]> = species.choices.map((choice): [string, string[]] => {
    const values = unique(selected?.[choice.id] ?? []).filter((value) => choice.options.includes(value)).slice(0, choice.maxSelections)
    return [choice.id, values]
  }).filter(([, values]) => values.length > 0)
  return Object.fromEntries(entries)
}

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

function abilityBonuses(options: AbilityKey[], focus: AbilityKey | undefined): Partial<Record<AbilityKey, number>> {
  const selected = [...new Set(options)]
  const result: Partial<Record<AbilityKey, number>> = {}
  for (const key of selected) result[key] = key === focus ? 2 : 1
  return result
}

/** Applies only the data that is selected in the 2024 creation flow. Legacy fields stay as aliases. */
export function applyCharacterCreation2024(character: CharacterSheetView, payload: CharacterCreationPayload): CharacterSheetView {
  const next = cloneCharacterView(character)
  const species = getSpecies2024(payload.speciesId ?? payload.raceId)
  if (!species) throw new Error(`Неизвестный вид D&D 2024: ${payload.speciesId ?? payload.raceId}`)
  const classOption = getRules2024Class(payload.classId)
  if (!classOption) throw new Error(`Неизвестный класс D&D 2024: ${payload.classId}`)
  const background = payload.backgroundId ? getRules2024Background(payload.backgroundId) : undefined
  if (payload.backgroundId && !background) throw new Error(`Неизвестная предыстория D&D 2024: ${payload.backgroundId}`)
  const featId = payload.originFeatId ?? background?.originFeatId
  const feat = featId ? getRules2024Feat(featId) : undefined
  if (payload.originFeatId && !feat) throw new Error(`Неизвестная черта происхождения D&D 2024: ${payload.originFeatId}`)
  if (background && feat?.source === 'background' && feat.id !== background.originFeatId) throw new Error('Черта происхождения не соответствует выбранной предыстории.')
  const previousCreation = next.creation
  const previousClassSavingThrows = previousCreation?.classSavingThrowKeys ?? []
  const previousManualSavingThrows = previousCreation?.manualSavingThrowKeys ?? []
  const classSkillIds = unique(payload.classSkillIds.filter((id) => classOption.skillOptions.includes(id))).slice(0, classOption.skillChoiceCount)
  const backgroundSkillIds = [...(background?.skillProficiencies ?? [])]
  const requestedAbilities = background ? (payload.originAbilityChoices ?? background.abilityOptions) : []
  const chosenAbilities = [...new Set(requestedAbilities)]
  if (background && (chosenAbilities.length !== 3 || chosenAbilities.some((key) => !background.abilityOptions.includes(key)))) {
    throw new Error('Некорректный выбор характеристик предыстории D&D 2024.')
  }
  if (background && payload.originAbilityFocus !== undefined && !chosenAbilities.includes(payload.originAbilityFocus)) {
    throw new Error('Фокус бонуса должен входить в выбранные характеристики предыстории.')
  }
  const bonuses = background ? abilityBonuses(chosenAbilities, payload.originAbilityFocus) : {}
  const speciesChoices = selectedSpeciesChoices(species, payload.speciesChoices)
  if (payload.speciesChoices !== undefined && species.choices.some((choice) => (speciesChoices[choice.id]?.length ?? 0) < choice.minSelections)) {
    throw new Error('Не выбран обязательный вариант особенности вида D&D 2024.')
  }
  const abilityBonusSources = Object.fromEntries(ABILITY_KEYS.map((key) => {
    const preservedFeatSources = (previousCreation?.abilityBonusSources?.[key] ?? []).filter((entry) => entry.source === 'feat')
    return [key, [...preservedFeatSources, ...(bonuses[key] === undefined ? [] : [{ source: 'background' as const, amount: bonuses[key] }])]]
  })) as CharacterCreationV3['abilityBonusSources']
  const oldCreationIds = new Set(previousCreation?.startingEquipmentIds ?? [])
  const creationPrefix = `creation:${next.id}:`
  const preservedItems = next.inventoryData.items.filter((item) => !(item.source === 'creation' && (oldCreationIds.has(item.id) || item.id.startsWith(creationPrefix))))
  const classKit = payload.classEquipmentId ? classOption.equipmentOptions.find((item) => item.id === payload.classEquipmentId) : classOption.equipmentOptions[0]
  const backgroundKit = background
    ? (payload.backgroundEquipmentId ? background.equipmentOptions.find((item) => item.id === payload.backgroundEquipmentId) : background.equipmentOptions[0])
    : undefined
  const generatedItemsWithCurrency = [...selectedEquipment(classKit, next.id, 'class'), ...selectedEquipment(backgroundKit, next.id, 'background')]
  const generatedGold = generatedItemsWithCurrency.filter((item) => item.properties.includes('currency')).reduce((sum, item) => sum + item.quantity, 0)
  const generatedItems = generatedItemsWithCurrency.filter((item) => !item.properties.includes('currency'))

  next.ruleset = '2024'
  next.name = payload.name.trim() || next.name
  next.class = classOption.label
  next.subclass = payload.subclass.trim()
  next.alignment = payload.alignment.trim()
  next.race = { name: species.label, subrace: '', size: species.size, speed: species.speed, abilityBonuses: {}, traits: [...species.traits], languages: [...species.languages] }
  next.background = background
    ? { name: background.label, feature: background.feature, skillProficiencies: [...background.skillProficiencies], toolProficiencies: [...background.toolProficiencies], languages: [...background.languages], notes: background.description }
    : { name: '', feature: '', skillProficiencies: [], toolProficiencies: [], languages: [], notes: '' }
  next.origin = { species: species.label, background: background?.label ?? '', featId: feat?.id, originFeat: feat?.label ?? '', languages: unique([...species.languages, ...(background?.languages ?? [])]), tools: [...(background?.toolProficiencies ?? [])] }
  next.abilities = Object.fromEntries(ABILITY_KEYS.map((key) => [key, payload.baseAbilities[key] + (bonuses[key] ?? 0)])) as CharacterSheetView['abilities']

  next.skills = next.skills.map((skill) => {
    const previousSources = skill.proficiencySources ?? (skill.proficiency === 'none' ? [] : ['manual' as SkillProficiencySource])
    const oldRaceSkills = new Set([...(previousCreation?.raceSkillIds ?? []), ...(previousCreation?.subraceSkillIds ?? [])])
    const sources = [...new Set([
      ...previousSources.filter((source) => (source === 'race' && !oldRaceSkills.has(skill.id)) || source === 'manual' || source === 'feat'),
      ...(classSkillIds.includes(skill.id) ? ['class' as SkillProficiencySource] : []),
      ...(backgroundSkillIds.includes(skill.id) ? ['background' as SkillProficiencySource] : []),
    ])]
    const hasManualSource = previousSources.includes('manual')
    const hasDerivedSource = sources.some((source) => source !== 'manual')
    const calculationMode = skill.calculationMode === 'manual' && !hasManualSource && hasDerivedSource && skill.value === 0 && skill.additionalBonus === 0
      ? 'computed' : skill.calculationMode
    return { ...skill, calculationMode, proficiency: skill.proficiency === 'expertise' && sources.length ? 'expertise' : sources.length ? 'proficient' : 'none', proficiencySources: sources }
  })

  const newlyManualSavingThrows = ABILITY_KEYS.filter((key) => !previousClassSavingThrows.includes(key) && !previousManualSavingThrows.includes(key) && next.savingThrows[key].proficient)
  const manualSavingThrowKeys = ABILITY_KEYS.filter((key) => next.savingThrows[key].proficient && (previousManualSavingThrows.includes(key) || newlyManualSavingThrows.includes(key)))
  for (const key of ABILITY_KEYS) next.savingThrows[key] = { ...next.savingThrows[key], proficient: manualSavingThrowKeys.includes(key) || classOption.savingThrowKeys.includes(key) }
  const oldClassTools = previousCreation?.classProficiencies ?? []
  const oldBackgroundTools = previousCreation?.backgroundToolProficiencies ?? next.background.toolProficiencies
  const manualTools = next.proficiency.toolProficiencies.filter((tool) => !oldClassTools.includes(tool) && !oldBackgroundTools.includes(tool))
  const oldLanguages = unique([...(previousCreation?.raceLanguages ?? []), ...(previousCreation?.backgroundLanguages ?? [])])
  const manualLanguages = next.proficiency.languageProficiencies.filter((language) => !oldLanguages.includes(language))
  next.proficiency = { ...next.proficiency, toolProficiencies: unique([...manualTools, ...classOption.proficiencies, ...(background?.toolProficiencies ?? [])]), languageProficiencies: unique([...manualLanguages, ...species.languages, ...(background?.languages ?? [])]) }
  next.combat.speed.base = species.speed
  next.spellcasting.spellRuleset = '2024'
  next.spellcasting.spellcastingAbility = classOption.spellcastingAbility
  next.spellcasting.spellProgressionType = classOption.spellProgressionType
  next.inventoryData.items = [...preservedItems, ...generatedItems]
  const previousGeneratedGold = previousCreation?.ruleset === '2024' ? (previousCreation.startingGold ?? 0) : 0
  next.inventoryData.money = { ...next.inventoryData.money, gold: Math.max(0, next.inventoryData.money.gold - previousGeneratedGold + generatedGold) }

  const creation: CharacterCreationV3 = {
    ruleset: '2024', speciesId: species.id, raceId: species.id, classId: classOption.id, classLevel: next.level, classSources: [{ kind: 'class', id: classOption.id, label: classOption.name }], spellProgressionType: classOption.spellProgressionType, backgroundId: background?.id, originFeatId: feat?.id, originAbilityChoices: chosenAbilities.length ? [...chosenAbilities] : undefined, originAbilityFocus: chosenAbilities.length ? payload.originAbilityFocus : undefined, abilityBonusSources, speciesChoices,
    baseAbilityScores: { ...payload.baseAbilities }, raceSkillIds: [], raceAbilityChoices: [], subraceSkillIds: [], classSkillIds: [...classSkillIds], backgroundSkillIds: [...backgroundSkillIds],
    classSavingThrowKeys: [...classOption.savingThrowKeys], manualSavingThrowKeys, classFeatures: [...classOption.features], raceFeatures: [...species.traits], subraceFeatures: [], classProficiencies: [...classOption.proficiencies],
    backgroundToolProficiencies: [...(background?.toolProficiencies ?? [])], raceLanguages: [...species.languages], subraceLanguages: [], backgroundLanguages: [...(background?.languages ?? [])], classEquipmentId: classKit?.id, backgroundEquipmentId: backgroundKit?.id,
    startingEquipmentIds: generatedItems.map((item) => item.id), startingGold: generatedGold,
  }
  next.creation = creation
  next.progression = progressionAfterCreation(character.progression, progressionForClass({
    ruleset: '2024',
    classId: classOption.id,
    level: next.level,
    featureIds: classOption.levelFeaturesMetadata.filter((feature) => feature.level <= next.level).map((feature) => feature.id),
    choices: {
      classSkills: [...classSkillIds],
      ...(classKit?.id ? { classEquipment: [classKit.id] } : {}),
      ...(backgroundKit?.id ? { backgroundEquipment: [backgroundKit.id] } : {}),
    },
  }), character.ruleset, '2024')
  next.features = [...next.progression.features]
  return next
}
