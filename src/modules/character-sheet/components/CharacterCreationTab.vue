<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CBtn, CInput } from '@/ui/components'
import { ABILITY_FIELDS } from '../data/characterFields.ts'
import { DND5E_CLASSES, DND5E_RACES, findClass, findRace, findSubrace, subracesForRace, type Dnd5eClassOption, type Dnd5eRaceOption } from '../data/dnd5eOptions.ts'
import { RULES_2024_CLASSES, RULES_2024_SPECIES, findRules2024Class, findSpecies2024, getRules2024ClassFeatures } from '../data/rules2024/index.ts'
import { abilityModifier, signedModifier } from '../domain/abilityModifier.ts'
import { calculateSkillBonus } from '../domain/skillBonus.ts'
import type { AbilityKey, CharacterAbilities } from '../types/character.ts'
import type { CharacterRuleset } from '../types/characterV3.ts'
import type { CharacterCreationPayload } from '../domain/characterCreation.ts'
import type { CharacterSheetView } from '../types/characterView.ts'

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean; hidePreview?: boolean }>()
const emit = defineEmits<{ create: [payload: CharacterCreationPayload]; 'back-to-sheet': [] }>()
const creation = props.character.creation
const stepNames = ['Имя', 'Раса', 'Подраса', 'Класс', 'Характеристики', 'Навыки', 'Снаряжение', 'Готово']
const stepDescriptions = [
  'Дайте герою имя и задайте его первое впечатление.',
  'Выберите народ и познакомьтесь с его наследием.',
  'Уточните традицию и черты своей общины.',
  'Выберите путь и таланты первого уровня.',
  'Распределите исходные значения характеристик.',
  'Выберите навыки и проверьте источники владения.',
  'Подготовьте снаряжение, с которым начнётся путь.',
  'Проверьте образ героя и примените выборы к листу.',
]
const modernStepNames = ['Имя', 'Вид', 'Особенности вида', 'Класс', 'Характеристики', 'Навыки', 'Снаряжение', 'Готово']
const modernStepDescriptions = [
  'Дайте герою имя и выберите редакцию правил.',
  'Выберите вид и познакомьтесь с его наследием.',
  'Проверьте наследие вида, выбранное на предыдущем шаге.',
  'Выберите класс и его особенности первого уровня.',
  'Распределите исходные значения характеристик.',
  'Выберите навыки класса и проверьте источники владения.',
  'Подготовьте снаряжение, с которым начнётся путь.',
  'Проверьте образ героя и примените выборы к листу.',
]
function stepLabel(index: number) { return ruleset.value === '2024' ? modernStepNames[index] ?? '' : stepNames[index] ?? '' }
function stepDescription(index: number) { return ruleset.value === '2024' ? modernStepDescriptions[index] ?? '' : stepDescriptions[index] ?? '' }
const currentStep = ref(1)
const ruleset = ref<CharacterRuleset>(creation?.ruleset ?? (props.character.creation ? props.character.ruleset : '2024'))
const highestUnlockedStep = ref(1)
const completed = ref(false)
const initialRuleset = ruleset.value
const raceId = ref(creation?.speciesId ?? creation?.raceId ?? (initialRuleset === '2024' ? RULES_2024_SPECIES[0]!.id : DND5E_RACES[0]!.id))
const subraceId = ref(creation?.subraceId ?? subracesForRace(raceId.value)[0]?.id ?? '')
const classId = ref(creation?.classId ?? (initialRuleset === '2024' ? RULES_2024_CLASSES[0]!.id : DND5E_CLASSES[DND5E_CLASSES.length - 1]!.id))
// Background remains part of the saved model for old sheets, but the new wizard lets players choose skills directly.
const backgroundId = ref('')
const speciesChoices = ref<Record<string, string[]>>(creation?.speciesChoices ? JSON.parse(JSON.stringify(creation.speciesChoices)) as Record<string, string[]> : {})
const name = ref(props.character.name)
const subclass = ref(props.character.subclass)
const alignment = ref(props.character.alignment)
const initialClass = initialRuleset === '2024' ? classAsLegacy(classId.value) : findClass(classId.value)
const initialRace = initialRuleset === '2024' ? speciesAsLegacy(raceId.value) : findRace(raceId.value)
const selectedSkillIds = ref<string[]>([...new Set(creation?.classSkillIds ?? [])].filter((id) => initialClass.skillOptions.includes(id)).slice(0, initialClass.skillChoiceCount))
const raceSkillChoices = ref<string[]>([...new Set(creation?.raceSkillIds ?? [])].filter((id) => initialRace.skillChoices?.options.includes(id)).slice(0, initialRace.skillChoices?.count ?? 0))
const raceAbilityChoices = ref<AbilityKey[]>(creation?.raceAbilityChoices ? [...creation.raceAbilityChoices] : [])
const baseAbilities = reactive<CharacterAbilities>({ ...(creation?.baseAbilityScores ?? props.character.abilities) })
const classEquipmentId = ref(creation?.classEquipmentId ?? initialClass.equipmentOptions?.[0]?.id ?? '')

function speciesAsLegacy(id: string): Dnd5eRaceOption {
  const species = findSpecies2024(id)
  return { id: species.id, label: species.name, profile: { name: species.name, subrace: '', size: species.size, speed: species.speed, abilityBonuses: {}, traits: [...species.traits], languages: [...species.languages] } }
}
function classAsLegacy(id: string): Dnd5eClassOption {
  const option = findRules2024Class(id)
  return {
    id: option.id, label: option.label, description: option.description, hitDie: option.hitDie, primaryAbility: option.primaryAbility, primaryAbilities: [...option.primaryAbilities],
    spellcastingAbility: option.spellcastingAbility, spellProgressionType: option.spellProgressionType, savingThrowKeys: [...option.savingThrowKeys], savingThrowProficiencies: [...option.savingThrowProficiencies],
    skillChoiceCount: option.skillChoiceCount, skillOptions: [...option.skillOptions], skillChoices: { count: option.skillChoices.count, options: [...option.skillChoices.options] }, features: [...option.features], proficiencies: [...option.proficiencies],
    weaponProficiencies: [...option.weaponProficiencies], armorProficiencies: [...option.armorProficiencies], equipmentOptions: option.equipmentOptions, startingEquipment: option.startingEquipment,
  }
}
const raceOptions = computed<Dnd5eRaceOption[]>(() => ruleset.value === '2024' ? RULES_2024_SPECIES.map((species) => speciesAsLegacy(species.id)) : DND5E_RACES)
const classOptions = computed<Dnd5eClassOption[]>(() => ruleset.value === '2024' ? RULES_2024_CLASSES.map((item) => classAsLegacy(item.id)) : DND5E_CLASSES)
const selectedRace = computed(() => ruleset.value === '2024' ? speciesAsLegacy(raceId.value) : findRace(raceId.value))
const selected2024Species = computed(() => findSpecies2024(raceId.value))
const selectedSubrace = computed(() => ruleset.value === '2024' ? undefined : findSubrace(raceId.value, subraceId.value))
const selectedClass = computed(() => ruleset.value === '2024' ? classAsLegacy(classId.value) : findClass(classId.value))
const availableSubraces = computed(() => ruleset.value === '2024' ? [] : subracesForRace(raceId.value))
const classEquipmentOptions = computed(() => selectedClass.value.equipmentOptions ?? [])
const skillLabels = computed(() => Object.fromEntries(props.character.skills.map((skill) => [skill.id, skill.name])) as Record<string, string>)
const selectedCount = computed(() => selectedSkillIds.value.filter((id) => selectedClass.value.skillOptions.includes(id)).length)
const raceSelectedCount = computed(() => raceSkillChoices.value.filter((id) => selectedRace.value.skillChoices?.options.includes(id)).length)
const classSkillsRemaining = computed(() => Math.max(0, selectedClass.value.skillChoiceCount - selectedCount.value))
const raceSkillsRemaining = computed(() => Math.max(0, (selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value))
const selectableSkills = computed(() => props.character.skills.filter((skill) => selectedClass.value.skillOptions.includes(skill.id) || selectedRace.value.skillChoices?.options.includes(skill.id)))
function spellProgressionLabel(value: Dnd5eClassOption['spellProgressionType']): string {
  return ({ none: 'Нет', prepared: 'Подготовка', known: 'Известные заклинания', pact: 'Магия договора' } as Record<string, string>)[value ?? ''] ?? 'Не указано'
}
const speciesChoiceIssue = computed(() => {
  if (ruleset.value !== '2024') return ''
  const missing = selected2024Species.value.choices.find((choice) => (speciesChoices.value[choice.id]?.length ?? 0) < choice.minSelections)
  return missing ? `Выберите вариант: ${missing.label}.` : ''
})
const finalAbility = (key: AbilityKey) => {
  if (ruleset.value === '2024') return baseAbilities[key]
  return baseAbilities[key] + (selectedRace.value.profile.abilityBonuses[key] ?? 0) + (selectedSubrace.value?.abilityBonuses[key] ?? 0) + (selectedRace.value.abilityChoices && raceAbilityChoices.value.includes(key) ? selectedRace.value.abilityChoices.bonus : 0)
}
const initials = computed(() => name.value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('ru-RU') ?? '').join('') || '✦')
const derivedRaceSkills = computed(() => ruleset.value === '2024' ? [] : [...new Set([...(selectedRace.value.skillProficiencies ?? []), ...raceSkillChoices.value, ...(selectedSubrace.value?.skillProficiencies ?? [])])])
const currentOwnedSkills = computed(() => props.character.skills.map((skill) => {
  const sources = new Set<string>()
  if (derivedRaceSkills.value.includes(skill.id)) sources.add('race')
  if (selectedSkillIds.value.includes(skill.id)) sources.add('class')
  for (const source of skill.proficiencySources ?? []) if (source === 'manual' || source === 'feat') sources.add(source)
  const proficiency = sources.size > 0 ? 'proficient' : 'none'
  const bonus = calculateSkillBonus({ ...skill, proficiency, calculationMode: 'computed', additionalBonus: skill.additionalBonus }, { ...baseAbilities, ...Object.fromEntries(ABILITY_FIELDS.map((field) => [field.key, finalAbility(field.key)])) }, props.character.level)
  return { ...skill, sources: [...sources], proficiency, bonus }
}).filter((skill) => skill.sources.length > 0))
const selectedClassKit = computed(() => classEquipmentOptions.value.find((option) => option.id === classEquipmentId.value))
const previewEquipment = computed(() => [...(selectedClassKit.value?.items.map((item) => ({ ...item, source: 'Класс' })) ?? [])])
const previewClassFeatures = computed(() => ruleset.value === '2024'
  ? getRules2024ClassFeatures(classId.value, props.character.level).map((feature) => feature.name)
  : selectedClass.value.features)
const previewFeatures = computed(() => [...selectedRace.value.profile.traits, ...(selectedSubrace.value?.traits ?? []), ...previewClassFeatures.value].filter(Boolean))
const stepProgress = computed(() => Math.round((currentStep.value / stepNames.length) * 100))
const abilityError = computed(() => ABILITY_FIELDS.some((field) => !Number.isInteger(baseAbilities[field.key]) || baseAbilities[field.key] < 1 || baseAbilities[field.key] > 30))
const stepIssue = computed(() => {
  if (currentStep.value === 1 && !name.value.trim()) return 'Введите имя персонажа, чтобы продолжить.'
  if (currentStep.value === 2 && speciesChoiceIssue.value) return speciesChoiceIssue.value
  if (currentStep.value === 3 && availableSubraces.value.length > 0 && !selectedSubrace.value) return 'Выберите подрасу для выбранной расы.'
  if (currentStep.value === 5 && abilityError.value) return 'Каждая характеристика должна быть целым числом от 1 до 30.'
  if (currentStep.value === 6 && selectedCount.value !== selectedClass.value.skillChoiceCount) return `Выберите навыки класса: ${selectedClass.value.skillChoiceCount - selectedCount.value > 0 ? `осталось ${selectedClass.value.skillChoiceCount - selectedCount.value}` : `уберите лишние ${selectedCount.value - selectedClass.value.skillChoiceCount}`}.`
  if (currentStep.value === 6 && raceSelectedCount.value !== (selectedRace.value.skillChoices?.count ?? 0)) return `Выберите навыки вида: осталось ${(selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value}`
  if (currentStep.value === 7 && classEquipmentOptions.value.length && !selectedClassKit.value) return 'Выберите один набор снаряжения класса.'
  return ''
})
const canContinue = computed(() => !stepIssue.value)

function goToStep(step: number) {
  if (step < 1 || step > highestUnlockedStep.value || step > stepNames.length) return
  currentStep.value = step
  completed.value = false
}
function nextStep() {
  if (!canContinue.value || currentStep.value >= stepNames.length) return
  currentStep.value += 1
  highestUnlockedStep.value = Math.max(highestUnlockedStep.value, currentStep.value)
}
function previousStep() { if (currentStep.value > 1) goToStep(currentStep.value - 1) }
function updateRace(id: string) {
  raceId.value = id
  subraceId.value = ruleset.value === '2024' ? '' : subracesForRace(id)[0]?.id ?? ''
  raceAbilityChoices.value = selectedRace.value.abilityChoices?.options.slice(0, selectedRace.value.abilityChoices.count) ?? []
  raceSkillChoices.value = []
  speciesChoices.value = {}
  completed.value = false
}
function updateClass(id: string) {
  classId.value = id
  const nextClass = ruleset.value === '2024' ? classAsLegacy(id) : findClass(id)
  selectedSkillIds.value = [...new Set(selectedSkillIds.value.filter((skillId) => nextClass.skillOptions.includes(skillId)))].slice(0, nextClass.skillChoiceCount)
  classEquipmentId.value = nextClass.equipmentOptions?.[0]?.id ?? ''
  completed.value = false
}
function updateAbility(key: AbilityKey, value: unknown) {
  const parsed = Number(value)
  baseAbilities[key] = Number.isFinite(parsed) ? Math.trunc(parsed) : 0
  completed.value = false
}
function toggleClassSkill(id: string) {
  if (!selectedClass.value.skillOptions.includes(id)) return
  if (selectedSkillIds.value.includes(id)) selectedSkillIds.value = selectedSkillIds.value.filter((item) => item !== id)
  else if (selectedCount.value < selectedClass.value.skillChoiceCount) selectedSkillIds.value = [...new Set([...selectedSkillIds.value, id])]
  completed.value = false
}
function toggleRaceSkill(id: string) {
  const options = selectedRace.value.skillChoices?.options ?? []
  const limit = selectedRace.value.skillChoices?.count ?? 0
  if (!options.includes(id)) return
  if (raceSkillChoices.value.includes(id)) raceSkillChoices.value = raceSkillChoices.value.filter((item) => item !== id)
  else if (raceSelectedCount.value < limit) raceSkillChoices.value = [...new Set([...raceSkillChoices.value, id])]
  completed.value = false
}
function isSkillChoiceSelected(id: string) {
  return selectedSkillIds.value.includes(id) || raceSkillChoices.value.includes(id)
}
function canSelectSkill(id: string) {
  const classAvailable = selectedClass.value.skillOptions.includes(id) && selectedCount.value < selectedClass.value.skillChoiceCount
  const raceAvailable = selectedRace.value.skillChoices?.options.includes(id) && raceSelectedCount.value < (selectedRace.value.skillChoices?.count ?? 0)
  return classAvailable || raceAvailable
}
function toggleSelectableSkill(id: string) {
  const classOption = selectedClass.value.skillOptions.includes(id)
  const raceOption = selectedRace.value.skillChoices?.options.includes(id) ?? false
  if (classOption && (selectedSkillIds.value.includes(id) || !raceOption || selectedCount.value < selectedClass.value.skillChoiceCount)) {
    toggleClassSkill(id)
    return
  }
  if (raceOption) toggleRaceSkill(id)
}
function selectableSkillSource(id: string) {
  const sources: string[] = []
  if (selectedClass.value.skillOptions.includes(id)) sources.push('Класс')
  if (selectedRace.value.skillChoices?.options.includes(id)) sources.push('Вид')
  return sources.join(' · ')
}
function selectSubrace(id: string) { subraceId.value = id; completed.value = false }
function selectClassKit(id: string) { classEquipmentId.value = id; completed.value = false }
function updateRuleset(value: CharacterRuleset) {
  ruleset.value = value
  if (value === '2024') {
    raceId.value = RULES_2024_SPECIES[0]!.id
    classId.value = RULES_2024_CLASSES[0]!.id
    backgroundId.value = ''
  } else {
    raceId.value = DND5E_RACES[0]!.id
    classId.value = DND5E_CLASSES[DND5E_CLASSES.length - 1]!.id
    backgroundId.value = ''
  }
  subraceId.value = ''
  classEquipmentId.value = selectedClass.value.equipmentOptions?.[0]?.id ?? ''
  selectedSkillIds.value = []
  raceSkillChoices.value = []
  speciesChoices.value = {}
  completed.value = false
}
function selectSpeciesChoice(choiceId: string, value: string) {
  speciesChoices.value = { ...speciesChoices.value, [choiceId]: [value] }
  completed.value = false
}
function raceBonusLines(raceIdValue: string) {
  if (ruleset.value === '2024') return ['Бонусы характеристик задаются исходными значениями']
  const race = findRace(raceIdValue)
  return Object.entries(race.profile.abilityBonuses).map(([key, value]) => `${ABILITY_FIELDS.find((field) => field.key === key)?.label} ${signedModifier(value ?? 0)}`)
}
function subraceBonusLines(subraceIdValue: string) {
  const subrace = findSubrace(raceId.value, subraceIdValue)
  return Object.entries(subrace?.abilityBonuses ?? {}).map(([key, value]) => `${ABILITY_FIELDS.find((field) => field.key === key)?.label} ${signedModifier(value ?? 0)}`)
}
function sourceLabel(source: string) { return ({ race: 'Вид', class: 'Класс', background: 'Предыстория', feat: 'Черта', manual: 'Вручную' } as Record<string, string>)[source] ?? source }
function applyCreation() {
  if (stepIssue.value || !name.value.trim()) return
  const payload: CharacterCreationPayload = {
    ruleset: ruleset.value,
    speciesId: ruleset.value === '2024' ? raceId.value : undefined,
    speciesChoices: ruleset.value === '2024' ? JSON.parse(JSON.stringify(speciesChoices.value)) as Record<string, string[]> : undefined,
    name: name.value,
    raceId: raceId.value,
    subraceId: subraceId.value || undefined,
    classId: classId.value,
    backgroundId: backgroundId.value,
    subclass: subclass.value,
    alignment: alignment.value,
    baseAbilities: { ...baseAbilities },
    classSkillIds: [...selectedSkillIds.value],
    raceSkillChoices: [...raceSkillChoices.value],
    raceAbilityChoices: [...raceAbilityChoices.value],
    classEquipmentId: classEquipmentId.value || undefined,
    backgroundEquipmentId: undefined,
  }
  emit('create', payload)
  completed.value = true
}
</script>

<template>
  <div class="tab-content creation-tab">
    <header class="creation-hero sheet-section">
      <div class="creation-hero-mark" aria-hidden="true">✦</div>
      <div class="creation-hero-copy">
        <p class="eyebrow">Хроники начинаются здесь</p>
        <h1>Создание персонажа</h1>
        <p class="section-note">{{ stepDescription(currentStep - 1) }}</p>
      </div>
      <div class="creation-progress-copy"><strong>Шаг {{ currentStep }} из {{ stepNames.length }}</strong><span>{{ stepLabel(currentStep - 1) }}</span></div>
      <div class="creation-progress-track" role="progressbar" :aria-valuenow="currentStep" :aria-valuemin="1" :aria-valuemax="stepNames.length" :aria-label="`Шаг ${currentStep} из ${stepNames.length}`"><span :style="{ width: `${stepProgress}%` }"></span></div>
    </header>

    <nav class="creation-step-nav" aria-label="Шаги создания персонажа">
      <ol>
        <li v-for="(_, index) in stepNames" :key="stepLabel(index)" :class="{ active: currentStep === index + 1, done: index + 1 < currentStep, locked: index + 1 > highestUnlockedStep }">
          <button type="button" :disabled="disabled || index + 1 > highestUnlockedStep" :aria-current="currentStep === index + 1 ? 'step' : undefined" :aria-label="`${index + 1}. ${stepLabel(index)}${index + 1 > highestUnlockedStep ? ', недоступен' : index + 1 < currentStep ? ', завершён' : ''}`" @click="goToStep(index + 1)"><span class="step-number">{{ index + 1 < currentStep ? '✓' : index + 1 }}</span><span class="step-label">{{ stepLabel(index) }}</span></button>
        </li>
      </ol>
    </nav>

    <div class="creation-workspace">
      <div class="creation-main-column">
        <Transition name="creation-step" mode="out-in">
          <section :key="currentStep" class="sheet-section creation-step-panel" :aria-labelledby="`creation-step-title-${currentStep}`">
            <div class="creation-panel-heading"><div><p class="eyebrow">Этап {{ String(currentStep).padStart(2, '0') }}</p><h2 :id="`creation-step-title-${currentStep}`">{{ stepLabel(currentStep - 1) }}</h2><p class="section-note">{{ stepDescription(currentStep - 1) }}</p></div><span class="creation-rune" aria-hidden="true">{{ currentStep === 8 ? '✧' : '✦' }}</span></div>

            <div v-if="stepIssue" class="creation-error" role="alert">{{ stepIssue }}</div>

            <template v-if="currentStep === 1">
              <div class="creator-grid creation-identity-fields">
                <CInput label="Имя персонажа" :model-value="name" :disabled="disabled" autocomplete="off" @update:model-value="name = String($event ?? ''); completed = false" />
                <label class="compact-field creation-ruleset-field">Редакция правил
                  <select class="select-control" :value="ruleset" :disabled="disabled" @change="updateRuleset(($event.target as HTMLSelectElement).value as CharacterRuleset)"><option value="2024">D&amp;D 2024 / 5.5</option><option value="2014">D&amp;D 2014</option></select>
                </label>
                <CInput label="Мировоззрение (необязательно)" :model-value="alignment" :disabled="disabled" @update:model-value="alignment = String($event ?? '')" />
                <CInput label="Подкласс (позже)" :model-value="subclass" :disabled="disabled" @update:model-value="subclass = String($event ?? '')" />
              </div>
              <div class="creation-callout"><span aria-hidden="true">✧</span><p>Имя можно изменить позднее. Ваш выбор пока остаётся в черновике листа.</p></div>
            </template>

            <template v-else-if="currentStep === 2">
              <div class="selection-grid race-selection-grid" role="group" :aria-label="ruleset === '2024' ? 'Выберите вид' : 'Выберите расу'">
                <button v-for="race in raceOptions" :key="race.id" type="button" class="selection-card" :class="{ selected: raceId === race.id }" :aria-pressed="raceId === race.id" :disabled="disabled" @click="updateRace(race.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">{{ race.label.slice(0, 1) }}</span><span v-if="raceId === race.id" class="selection-check" aria-label="Выбрано">✓</span></span>
                  <strong>{{ race.label }}</strong><span class="selection-description">{{ race.profile.size }} · скорость {{ race.profile.speed }} фт.</span><span v-if="ruleset === '2024' && race.id === selected2024Species.id" class="selection-description">{{ selected2024Species.description }}</span>
                  <span class="selection-bonuses"><span v-for="bonus in raceBonusLines(race.id)" :key="bonus">{{ bonus }}</span></span>
                  <span class="selection-traits">Особенности: {{ race.profile.traits.join(' · ') }}</span>
                  <span v-if="ruleset === '2024' && race.id === selected2024Species.id" class="selection-origin">Языки: {{ selected2024Species.languages.join(', ') || 'не указаны' }}</span>
                  <span v-if="race.skillProficiencies?.length" class="selection-origin">Владение: {{ race.skillProficiencies.map((id) => skillLabels[id] ?? id).join(', ') }}</span>
                </button>
              </div>
              <div v-if="ruleset === '2024' && selected2024Species.choices.length" class="species-choice-panel">
                <div class="creation-panel-heading"><div><p class="eyebrow">Наследие вида</p><h3>Выберите особенность</h3><p class="section-note">Выбор сохраняется как источник «Вид»; механика будет подключена отдельным rules layer.</p></div><span class="creation-rune" aria-hidden="true">✧</span></div>
                <div v-for="choice in selected2024Species.choices" :key="choice.id" class="species-choice-row">
                  <div><strong>{{ choice.label }}</strong><p class="section-note">{{ choice.description }}</p></div>
                  <label class="compact-field"><span class="sr-only">{{ choice.label }}</span><select class="select-control" :value="speciesChoices[choice.id]?.[0] ?? ''" :disabled="disabled" @change="selectSpeciesChoice(choice.id, ($event.target as HTMLSelectElement).value)"><option value="" disabled>Выберите вариант</option><option v-for="option in choice.options" :key="option" :value="option">{{ option }}</option></select></label>
                </div>
              </div>
            </template>

            <template v-else-if="currentStep === 3">
              <div v-if="availableSubraces.length" class="selection-grid subrace-selection-grid" role="group" aria-label="Выберите подрасу">
                <button v-for="subrace in availableSubraces" :key="subrace.id" type="button" class="selection-card selection-card-wide" :class="{ selected: subraceId === subrace.id }" :aria-pressed="subraceId === subrace.id" :disabled="disabled" @click="selectSubrace(subrace.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">✧</span><span v-if="subraceId === subrace.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ subrace.label }}</strong><span class="selection-description">{{ subrace.description }}</span><span class="selection-bonuses"><span v-for="bonus in subraceBonusLines(subrace.id)" :key="bonus">{{ bonus }}</span></span><span class="selection-traits">{{ subrace.traits.join(' · ') }}</span><span v-if="subrace.languages?.length" class="selection-origin">Языки: {{ subrace.languages.join(', ') }}</span>
                </button>
              </div>
              <div v-else class="creation-callout"><span aria-hidden="true">✧</span><p v-if="ruleset === '2024'">В D&amp;D 2024 дополнительные варианты вида выбираются на предыдущем шаге. Можно перейти дальше.</p><p v-else>Для расы «{{ selectedRace.label }}» отдельные подрасы в текущем наборе правил не заданы. Можно перейти дальше.</p></div>
            </template>

            <template v-else-if="currentStep === 4">
              <div class="selection-grid class-selection-grid" role="group" aria-label="Выберите класс">
                <button v-for="item in classOptions" :key="item.id" type="button" class="selection-card" :class="{ selected: classId === item.id }" :aria-pressed="classId === item.id" :disabled="disabled" @click="updateClass(item.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">{{ item.hitDie }}</span><span v-if="classId === item.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ item.label }}</strong><span class="selection-description">{{ item.description ? `${item.description} Основная характеристика: ${ABILITY_FIELDS.find((field) => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}` : `Основная характеристика: ${ABILITY_FIELDS.find((field) => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}` }}</span><span class="selection-traits">Особенности: {{ item.features.join(' · ') }}</span><span class="selection-origin">Спасброски: {{ item.savingThrowKeys.map((key) => ABILITY_FIELDS.find((field) => field.key === key)?.label ?? key).join(' · ') }}</span><span class="selection-origin">Навыки: {{ item.skillOptions.map((id) => skillLabels[id] ?? id).join(' · ') }} · выбрать {{ item.skillChoiceCount }}</span><span v-if="item.weaponProficiencies?.length" class="selection-origin">Оружие: {{ item.weaponProficiencies.join(' · ') }}</span><span v-if="item.armorProficiencies?.length" class="selection-origin">Броня: {{ item.armorProficiencies.join(' · ') }}</span><span v-if="item.startingEquipment?.length" class="selection-origin">Снаряжение: {{ item.startingEquipment.map((kit) => kit.label).join(' · ') }}</span><span class="selection-origin">{{ item.spellcastingAbility ? `Магия: ${ABILITY_FIELDS.find((field) => field.key === item.spellcastingAbility)?.label} · ${spellProgressionLabel(item.spellProgressionType)}` : 'Без заклинаний на этом шаге' }}</span>
                </button>
              </div>
            </template>

            <template v-else-if="currentStep === 5">
              <div class="creation-source-hint"><span class="source-dot race-dot"></span><span>Выберите исходные значения характеристик. Навыки выбираются напрямую на следующем шаге.</span></div>
              <div class="creator-abilities creation-ability-grid"><article v-for="field in ABILITY_FIELDS" :key="field.key" class="creation-ability-card" :class="{ 'has-racial-bonus': finalAbility(field.key) !== baseAbilities[field.key] }"><CInput type="number" min="1" max="30" step="1" :label="field.label" :disabled="disabled" :model-value="baseAbilities[field.key]" @update:model-value="updateAbility(field.key, $event)" /><div class="ability-result"><span>Итог <b>{{ finalAbility(field.key) }}</b></span><strong>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</strong></div><span v-if="finalAbility(field.key) !== baseAbilities[field.key]" class="ability-source">{{ ruleset === '2024' ? 'Предыстория' : 'Раса / подраса' }} {{ signedModifier(finalAbility(field.key) - baseAbilities[field.key]) }}</span><span v-else class="ability-source">Без бонуса происхождения</span></article></div>
            </template>

            <template v-else-if="currentStep === 6">
              <div class="skill-step-summary"><span :class="{ 'selection-complete': classSkillsRemaining === 0 }">Выбор навыков: <b>{{ selectedCount }} / {{ selectedClass.skillChoiceCount }}</b><small>{{ classSkillsRemaining ? `Осталось выбрать: ${classSkillsRemaining}` : 'Выбор завершён' }}</small></span><span v-if="selectedRace.skillChoices?.count" :class="{ 'selection-complete': raceSkillsRemaining === 0 }">Навыки вида: <b>{{ raceSelectedCount }} / {{ selectedRace.skillChoices.count }}</b><small>{{ raceSkillsRemaining ? `Осталось выбрать: ${raceSkillsRemaining}` : 'Выбор завершён' }}</small></span></div>
              <div class="creation-skills-list"><button v-for="skill in selectableSkills" :key="skill.id" type="button" class="creation-skill-row creation-skill-choice" :class="{ selected: isSkillChoiceSelected(skill.id) }" :aria-pressed="isSkillChoiceSelected(skill.id)" :disabled="disabled || (!isSkillChoiceSelected(skill.id) && !canSelectSkill(skill.id))" @click="toggleSelectableSkill(skill.id)"><span class="creation-skill-name"><strong>{{ skill.name }}</strong><span>{{ ABILITY_FIELDS.find((field) => field.key === skill.ability)?.label ?? 'Характеристика не задана' }} · итог {{ currentOwnedSkills.find((entry) => entry.id === skill.id)?.bonus ?? signedModifier(abilityModifier(skill.ability ? finalAbility(skill.ability) : 10)) }}</span></span><span class="creation-skill-choice-source">{{ selectableSkillSource(skill.id) }}</span><span class="creation-skill-selection-check" :class="{ visible: isSkillChoiceSelected(skill.id) }" :aria-label="isSkillChoiceSelected(skill.id) ? 'Выбрано' : undefined">{{ isSkillChoiceSelected(skill.id) ? '✓' : '' }}</span></button></div>
              <p class="creation-source-explainer">Выберите ровно указанное количество навыков класса и вида. После достижения лимита остальные варианты блокируются. Владения складываются по источникам: один навык может одновременно происходить от вида, класса и ручной настройки.</p>
            </template>

            <template v-else-if="currentStep === 7">
              <div class="equipment-choice-group"><div class="equipment-group-heading"><h3>Набор класса · {{ selectedClass.label }}</h3><p class="section-note">Выберите один вариант — его предметы попадут в инвентарь при создании.</p></div><div class="selection-grid equipment-selection-grid"><button v-for="kit in classEquipmentOptions" :key="kit.id" type="button" class="selection-card equipment-card" :class="{ selected: classEquipmentId === kit.id }" :aria-pressed="classEquipmentId === kit.id" :disabled="disabled" @click="selectClassKit(kit.id)"><span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">⚔</span><span v-if="classEquipmentId === kit.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ kit.label }}</strong><span class="equipment-card-items">{{ kit.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ') }}</span><span class="selection-description">{{ kit.items.length }} позиций снаряжения</span></button></div></div>
              <div class="equipment-preview-strip"><strong>Будет добавлено в инвентарь</strong><span v-for="(item, index) in previewEquipment" :key="`${item.source}-${item.name}-${index}`">{{ item.name }} × {{ item.quantity }} <small>{{ item.source }}</small></span></div>
            </template>

            <template v-else>
              <div v-if="!completed" class="creation-review"><div class="review-medallion" aria-hidden="true">✦</div><p class="eyebrow">Последняя проверка</p><h3>{{ name.trim() || 'Безымянный герой' }}</h3><p class="review-identity">{{ selectedRace.label }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span> · {{ selectedClass.label }}</p><div class="review-abilities"><span v-for="field in ABILITY_FIELDS" :key="field.key"><small>{{ field.label.slice(0, 3) }}</small><b>{{ finalAbility(field.key) }}</b><em>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</em></span></div><div class="review-bottom"><div><strong>Особенности</strong><p>{{ previewFeatures.slice(0, 5).join(' · ') }}</p></div><div><strong>Снаряжение</strong><p>{{ previewEquipment.map((item) => `${item.name} × ${item.quantity}`).join(' · ') }}</p></div></div><div class="creation-callout"><span aria-hidden="true">✧</span><p>После создания изменения останутся черновиком. Используйте общую кнопку «Сохранить» на листе, чтобы записать персонажа.</p></div></div>
              <div v-else class="creation-finished"><div class="finished-seal" aria-hidden="true">✦</div><p class="eyebrow">Путь начинается</p><h3>Персонаж готов</h3><p>{{ name }} — {{ selectedRace.label }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span>, {{ selectedClass.label }}.</p><div class="finished-actions"><CBtn color-type="primary" @click="emit('back-to-sheet')">Открыть лист персонажа</CBtn><CBtn @click="completed = false">Изменить</CBtn></div></div>
            </template>

            <footer v-if="!completed" class="creation-navigation"><CBtn :disabled="disabled || currentStep === 1" @click="previousStep">Назад</CBtn><span class="navigation-step-caption">{{ currentStep }} / {{ stepNames.length }}</span><CBtn v-if="currentStep < stepNames.length" color-type="accent" :disabled="disabled || !canContinue" @click="nextStep">Далее</CBtn><CBtn v-else color-type="primary" :disabled="disabled || !canContinue" @click="applyCreation">Создать персонажа</CBtn></footer>
          </section>
        </Transition>
      </div>

      <aside v-if="!props.hidePreview" class="character-preview" :class="{ compact: currentStep !== 8 }" aria-label="Предпросмотр персонажа" aria-live="polite">
        <div class="preview-bookmark">Лист героя · предпросмотр</div>
        <div class="preview-portrait"><span class="portrait-frame"><span>{{ initials }}</span></span><span class="portrait-caption">Портрет появится позже</span></div>
        <div class="preview-identity"><p class="eyebrow">Новый искатель приключений</p><h2>{{ name.trim() || 'Имя героя' }}</h2><p>{{ selectedRace.label }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span></p><div class="preview-class-row"><span>{{ selectedClass.label }}</span><span>Уровень {{ props.character.level }}</span></div></div>
        <div class="preview-divider"><span>Характеристики</span></div>
        <div class="preview-ability-grid"><div v-for="field in ABILITY_FIELDS" :key="field.key"><small>{{ field.label }}</small><b>{{ finalAbility(field.key) }}</b><span>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</span></div></div>
        <div class="preview-section"><h3>Владения</h3><div v-if="currentOwnedSkills.length" class="preview-badges"><span v-for="skill in currentOwnedSkills.slice(0, 8)" :key="skill.id" class="preview-skill"><b>{{ skillLabels[skill.id] ?? skill.name }}</b><small>{{ skill.sources.map(sourceLabel).join(' + ') }}</small></span></div><p v-else class="preview-muted">Выберите навыки, чтобы увидеть владения.</p></div>
        <div class="preview-section"><h3>Особенности</h3><ul class="preview-feature-list"><li v-for="feature in previewFeatures.slice(0, currentStep === 8 ? 8 : 3)" :key="feature">{{ feature }}</li></ul></div>
        <div class="preview-section"><h3>Стартовое снаряжение</h3><ul v-if="previewEquipment.length" class="preview-equipment-list"><li v-for="(item, index) in previewEquipment.slice(0, currentStep === 8 ? 8 : 4)" :key="`${item.source}-${item.name}-${index}`">{{ item.name }} <span>× {{ item.quantity }}</span></li></ul><p v-else class="preview-muted">Пока не выбрано</p></div>
        <p class="preview-draft-note">Изменения пока не сохранены</p>
      </aside>
    </div>
  </div>
</template>
