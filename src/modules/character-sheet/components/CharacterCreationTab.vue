<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { CBtn, CInput } from '@/ui/components'
import { ABILITY_FIELDS } from '../data/characterFields.ts'
import { DND5E_BACKGROUNDS, DND5E_CLASSES, DND5E_RACES, findBackground, findClass, findRace, findSubrace, subracesForRace } from '../data/dnd5eOptions.ts'
import { abilityModifier, signedModifier } from '../domain/abilityModifier.ts'
import { calculateSkillBonus } from '../domain/skillBonus.ts'
import type { AbilityKey, CharacterAbilities } from '../types/character.ts'
import type { CharacterCreationPayload } from '../domain/characterCreation.ts'
import type { CharacterSheetView } from '../types/characterView.ts'

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean }>()
const emit = defineEmits<{ create: [payload: CharacterCreationPayload]; 'back-to-sheet': [] }>()
const creation = props.character.creation
const stepNames = ['Имя', 'Раса', 'Подраса', 'Класс', 'Предыстория', 'Характеристики', 'Навыки', 'Снаряжение', 'Готово']
const stepDescriptions = [
  'Дайте герою имя и задайте его первое впечатление.',
  'Выберите народ и познакомьтесь с его наследием.',
  'Уточните традицию и черты своей общины.',
  'Выберите путь и таланты первого уровня.',
  'Определите прошлое, связи и начальные владения.',
  'Распределите исходные значения характеристик.',
  'Выберите навыки и проверьте источники владения.',
  'Подготовьте снаряжение, с которым начнётся путь.',
  'Проверьте образ героя и примените выборы к листу.',
]
const currentStep = ref(1)
const highestUnlockedStep = ref(1)
const completed = ref(false)
const raceId = ref(creation?.raceId ?? DND5E_RACES[0]!.id)
const subraceId = ref(creation?.subraceId ?? subracesForRace(raceId.value)[0]?.id ?? '')
const classId = ref(creation?.classId ?? DND5E_CLASSES[DND5E_CLASSES.length - 1]!.id)
const backgroundId = ref(creation?.backgroundId ?? DND5E_BACKGROUNDS[0]!.id)
const name = ref(props.character.name)
const subclass = ref(props.character.subclass)
const alignment = ref(props.character.alignment)
const initialClass = findClass(classId.value)
const initialRace = findRace(raceId.value)
const selectedSkillIds = ref<string[]>([...new Set(creation?.classSkillIds ?? [])].filter((id) => initialClass.skillOptions.includes(id)).slice(0, initialClass.skillChoiceCount))
const raceSkillChoices = ref<string[]>([...new Set(creation?.raceSkillIds ?? [])].filter((id) => initialRace.skillChoices?.options.includes(id)).slice(0, initialRace.skillChoices?.count ?? 0))
const raceAbilityChoices = ref<AbilityKey[]>(creation?.raceAbilityChoices ? [...creation.raceAbilityChoices] : [])
const baseAbilities = reactive<CharacterAbilities>({ ...(creation?.baseAbilityScores ?? props.character.abilities) })
const classEquipmentId = ref(creation?.classEquipmentId ?? findClass(classId.value).equipmentOptions?.[0]?.id ?? '')
const backgroundEquipmentId = ref(creation?.backgroundEquipmentId ?? findBackground(backgroundId.value).equipmentOptions[0]?.id ?? '')

const selectedRace = computed(() => findRace(raceId.value))
const selectedSubrace = computed(() => findSubrace(raceId.value, subraceId.value))
const selectedClass = computed(() => findClass(classId.value))
const selectedBackground = computed(() => findBackground(backgroundId.value))
const availableSubraces = computed(() => subracesForRace(raceId.value))
const classEquipmentOptions = computed(() => selectedClass.value.equipmentOptions ?? [])
const backgroundEquipmentOptions = computed(() => selectedBackground.value.equipmentOptions)
const skillLabels = computed(() => Object.fromEntries(props.character.skills.map((skill) => [skill.id, skill.name])) as Record<string, string>)
const selectedCount = computed(() => selectedSkillIds.value.filter((id) => selectedClass.value.skillOptions.includes(id)).length)
const raceSelectedCount = computed(() => raceSkillChoices.value.filter((id) => selectedRace.value.skillChoices?.options.includes(id)).length)
const classSkillsRemaining = computed(() => Math.max(0, selectedClass.value.skillChoiceCount - selectedCount.value))
const raceSkillsRemaining = computed(() => Math.max(0, (selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value))
const finalAbility = (key: AbilityKey) => baseAbilities[key] + (selectedRace.value.profile.abilityBonuses[key] ?? 0) + (selectedSubrace.value?.abilityBonuses[key] ?? 0) + (selectedRace.value.abilityChoices && raceAbilityChoices.value.includes(key) ? selectedRace.value.abilityChoices.bonus : 0)
const initials = computed(() => name.value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase('ru-RU') ?? '').join('') || '✦')
const derivedRaceSkills = computed(() => [...new Set([...(selectedRace.value.skillProficiencies ?? []), ...raceSkillChoices.value, ...(selectedSubrace.value?.skillProficiencies ?? [])])])
const currentOwnedSkills = computed(() => props.character.skills.map((skill) => {
  const sources = new Set<string>()
  if (derivedRaceSkills.value.includes(skill.id)) sources.add('race')
  if (selectedSkillIds.value.includes(skill.id)) sources.add('class')
  if (selectedBackground.value.skillProficiencies.includes(skill.id)) sources.add('background')
  for (const source of skill.proficiencySources ?? []) if (source === 'manual') sources.add(source)
  const proficiency = sources.size > 0 ? 'proficient' : 'none'
  const bonus = calculateSkillBonus({ ...skill, proficiency, calculationMode: 'computed', additionalBonus: skill.additionalBonus }, { ...baseAbilities, ...Object.fromEntries(ABILITY_FIELDS.map((field) => [field.key, finalAbility(field.key)])) }, props.character.level)
  return { ...skill, sources: [...sources], proficiency, bonus }
}).filter((skill) => skill.sources.length > 0))
const selectedClassKit = computed(() => classEquipmentOptions.value.find((option) => option.id === classEquipmentId.value))
const selectedBackgroundKit = computed(() => backgroundEquipmentOptions.value.find((option) => option.id === backgroundEquipmentId.value))
const previewEquipment = computed(() => [...(selectedClassKit.value?.items.map((item) => ({ ...item, source: 'Класс' })) ?? []), ...(selectedBackgroundKit.value?.items.map((item) => ({ ...item, source: 'Предыстория' })) ?? [])])
const previewFeatures = computed(() => [...selectedRace.value.profile.traits, ...(selectedSubrace.value?.traits ?? []), ...selectedClass.value.features, selectedBackground.value.feature].filter(Boolean))
const stepProgress = computed(() => Math.round((currentStep.value / stepNames.length) * 100))
const abilityError = computed(() => ABILITY_FIELDS.some((field) => !Number.isInteger(baseAbilities[field.key]) || baseAbilities[field.key] < 1 || baseAbilities[field.key] > 30))
const stepIssue = computed(() => {
  if (currentStep.value === 1 && !name.value.trim()) return 'Введите имя персонажа, чтобы продолжить.'
  if (currentStep.value === 3 && availableSubraces.value.length > 0 && !selectedSubrace.value) return 'Выберите подрасу для выбранной расы.'
  if (currentStep.value === 6 && abilityError.value) return 'Каждая характеристика должна быть целым числом от 1 до 30.'
  if (currentStep.value === 7 && selectedCount.value !== selectedClass.value.skillChoiceCount) return `Выберите навыки класса: ${selectedClass.value.skillChoiceCount - selectedCount.value > 0 ? `осталось ${selectedClass.value.skillChoiceCount - selectedCount.value}` : `уберите лишние ${selectedCount.value - selectedClass.value.skillChoiceCount}`}.`
  if (currentStep.value === 7 && raceSelectedCount.value !== (selectedRace.value.skillChoices?.count ?? 0)) return `Выберите расовые навыки: осталось ${selectedRace.value.skillChoices!.count - raceSelectedCount.value}.`
  if (currentStep.value === 8 && classEquipmentOptions.value.length && !selectedClassKit.value) return 'Выберите один набор снаряжения класса.'
  if (currentStep.value === 8 && !selectedBackgroundKit.value) return 'Выберите набор снаряжения предыстории.'
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
  subraceId.value = subracesForRace(id)[0]?.id ?? ''
  raceAbilityChoices.value = selectedRace.value.abilityChoices?.options.slice(0, selectedRace.value.abilityChoices.count) ?? []
  raceSkillChoices.value = []
  completed.value = false
}
function updateClass(id: string) {
  classId.value = id
  const nextClass = findClass(id)
  selectedSkillIds.value = [...new Set(selectedSkillIds.value.filter((skillId) => nextClass.skillOptions.includes(skillId)))].slice(0, nextClass.skillChoiceCount)
  classEquipmentId.value = nextClass.equipmentOptions?.[0]?.id ?? ''
  completed.value = false
}
function updateBackground(id: string) {
  backgroundId.value = id
  backgroundEquipmentId.value = findBackground(id).equipmentOptions[0]?.id ?? ''
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
function selectSubrace(id: string) { subraceId.value = id; completed.value = false }
function selectClassKit(id: string) { classEquipmentId.value = id; completed.value = false }
function selectBackgroundKit(id: string) { backgroundEquipmentId.value = id; completed.value = false }
function raceBonusLines(raceIdValue: string) {
  const race = findRace(raceIdValue)
  return Object.entries(race.profile.abilityBonuses).map(([key, value]) => `${ABILITY_FIELDS.find((field) => field.key === key)?.label} ${signedModifier(value ?? 0)}`)
}
function subraceBonusLines(subraceIdValue: string) {
  const subrace = findSubrace(raceId.value, subraceIdValue)
  return Object.entries(subrace?.abilityBonuses ?? {}).map(([key, value]) => `${ABILITY_FIELDS.find((field) => field.key === key)?.label} ${signedModifier(value ?? 0)}`)
}
function sourceLabel(source: string) { return ({ race: 'Раса', class: 'Класс', background: 'Предыстория', manual: 'Вручную' } as Record<string, string>)[source] ?? source }
function applyCreation() {
  if (stepIssue.value || !name.value.trim()) return
  const payload: CharacterCreationPayload = {
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
    backgroundEquipmentId: backgroundEquipmentId.value || undefined,
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
        <p class="section-note">{{ stepDescriptions[currentStep - 1] }}</p>
      </div>
      <div class="creation-progress-copy"><strong>Шаг {{ currentStep }} из {{ stepNames.length }}</strong><span>{{ stepNames[currentStep - 1] }}</span></div>
      <div class="creation-progress-track" role="progressbar" :aria-valuenow="currentStep" :aria-valuemin="1" :aria-valuemax="stepNames.length" :aria-label="`Шаг ${currentStep} из ${stepNames.length}`"><span :style="{ width: `${stepProgress}%` }"></span></div>
    </header>

    <nav class="creation-step-nav" aria-label="Шаги создания персонажа">
      <ol>
        <li v-for="(step, index) in stepNames" :key="step" :class="{ active: currentStep === index + 1, done: index + 1 < currentStep, locked: index + 1 > highestUnlockedStep }">
          <button type="button" :disabled="disabled || index + 1 > highestUnlockedStep" :aria-current="currentStep === index + 1 ? 'step' : undefined" :aria-label="`${index + 1}. ${step}${index + 1 > highestUnlockedStep ? ', недоступен' : index + 1 < currentStep ? ', завершён' : ''}`" @click="goToStep(index + 1)"><span class="step-number">{{ index + 1 < currentStep ? '✓' : index + 1 }}</span><span class="step-label">{{ step }}</span></button>
        </li>
      </ol>
    </nav>

    <div class="creation-workspace">
      <div class="creation-main-column">
        <Transition name="creation-step" mode="out-in">
          <section :key="currentStep" class="sheet-section creation-step-panel" :aria-labelledby="`creation-step-title-${currentStep}`">
            <div class="creation-panel-heading"><div><p class="eyebrow">Этап {{ String(currentStep).padStart(2, '0') }}</p><h2 :id="`creation-step-title-${currentStep}`">{{ stepNames[currentStep - 1] }}</h2><p class="section-note">{{ stepDescriptions[currentStep - 1] }}</p></div><span class="creation-rune" aria-hidden="true">{{ currentStep === 9 ? '✧' : '✦' }}</span></div>

            <div v-if="stepIssue" class="creation-error" role="alert">{{ stepIssue }}</div>

            <template v-if="currentStep === 1">
              <div class="creator-grid creation-identity-fields">
                <CInput label="Имя персонажа" :model-value="name" :disabled="disabled" autocomplete="off" @update:model-value="name = String($event ?? ''); completed = false" />
                <CInput label="Мировоззрение (необязательно)" :model-value="alignment" :disabled="disabled" @update:model-value="alignment = String($event ?? '')" />
                <CInput label="Подкласс (позже)" :model-value="subclass" :disabled="disabled" @update:model-value="subclass = String($event ?? '')" />
              </div>
              <div class="creation-callout"><span aria-hidden="true">✧</span><p>Имя можно изменить позднее. Ваш выбор пока остаётся в черновике листа.</p></div>
            </template>

            <template v-else-if="currentStep === 2">
              <div class="selection-grid race-selection-grid" role="group" aria-label="Выберите расу">
                <button v-for="race in DND5E_RACES" :key="race.id" type="button" class="selection-card" :class="{ selected: raceId === race.id }" :aria-pressed="raceId === race.id" :disabled="disabled" @click="updateRace(race.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">{{ race.label.slice(0, 1) }}</span><span v-if="raceId === race.id" class="selection-check" aria-label="Выбрано">✓</span></span>
                  <strong>{{ race.label }}</strong><span class="selection-description">{{ race.profile.size }} · скорость {{ race.profile.speed }} фт.</span>
                  <span class="selection-bonuses"><span v-for="bonus in raceBonusLines(race.id)" :key="bonus">{{ bonus }}</span></span>
                  <span class="selection-traits">{{ race.profile.traits.slice(0, 3).join(' · ') }}</span>
                  <span v-if="race.skillProficiencies?.length" class="selection-origin">Владение: {{ race.skillProficiencies.map((id) => skillLabels[id] ?? id).join(', ') }}</span>
                </button>
              </div>
            </template>

            <template v-else-if="currentStep === 3">
              <div v-if="availableSubraces.length" class="selection-grid subrace-selection-grid" role="group" aria-label="Выберите подрасу">
                <button v-for="subrace in availableSubraces" :key="subrace.id" type="button" class="selection-card selection-card-wide" :class="{ selected: subraceId === subrace.id }" :aria-pressed="subraceId === subrace.id" :disabled="disabled" @click="selectSubrace(subrace.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">✧</span><span v-if="subraceId === subrace.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ subrace.label }}</strong><span class="selection-description">{{ subrace.description }}</span><span class="selection-bonuses"><span v-for="bonus in subraceBonusLines(subrace.id)" :key="bonus">{{ bonus }}</span></span><span class="selection-traits">{{ subrace.traits.join(' · ') }}</span><span v-if="subrace.languages?.length" class="selection-origin">Языки: {{ subrace.languages.join(', ') }}</span>
                </button>
              </div>
              <div v-else class="creation-callout"><span aria-hidden="true">✧</span><p>Для расы «{{ selectedRace.label }}» отдельные подрасы в текущем наборе правил не заданы. Можно перейти дальше.</p></div>
            </template>

            <template v-else-if="currentStep === 4">
              <div class="selection-grid class-selection-grid" role="group" aria-label="Выберите класс">
                <button v-for="item in DND5E_CLASSES" :key="item.id" type="button" class="selection-card" :class="{ selected: classId === item.id }" :aria-pressed="classId === item.id" :disabled="disabled" @click="updateClass(item.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">{{ item.hitDie }}</span><span v-if="classId === item.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ item.label }}</strong><span class="selection-description">Основная характеристика: {{ ABILITY_FIELDS.find((field) => field.key === item.primaryAbility)?.label }} · Хиты {{ item.hitDie }}</span><span class="selection-traits">{{ item.features.join(' · ') }}</span><span class="selection-origin">{{ item.spellcastingAbility ? `Магия: ${ABILITY_FIELDS.find((field) => field.key === item.spellcastingAbility)?.label}` : 'Без заклинаний на этом шаге' }}</span>
                </button>
              </div>
            </template>

            <template v-else-if="currentStep === 5">
              <div class="selection-grid background-selection-grid" role="group" aria-label="Выберите предысторию">
                <button v-for="background in DND5E_BACKGROUNDS" :key="background.id" type="button" class="selection-card selection-card-wide" :class="{ selected: backgroundId === background.id }" :aria-pressed="backgroundId === background.id" :disabled="disabled" @click="updateBackground(background.id)">
                  <span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">❖</span><span v-if="backgroundId === background.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ background.label }}</strong><span class="selection-description">{{ background.description }}</span><span class="selection-bonuses">Навыки: {{ background.skillProficiencies.map((id) => skillLabels[id] ?? id).join(' · ') }}</span><span class="selection-traits">{{ background.feature }}</span><span class="selection-origin">{{ [...background.toolProficiencies, ...background.languages].join(' · ') || 'Особые владения не заданы' }}</span>
                </button>
              </div>
            </template>

            <template v-else-if="currentStep === 6">
              <div class="creation-source-hint"><span class="source-dot race-dot"></span><span>Золотая рамка показывает итог с бонусами расы и подрасы; исходный score не меняется автоматически.</span></div>
              <div class="creator-abilities creation-ability-grid"><article v-for="field in ABILITY_FIELDS" :key="field.key" class="creation-ability-card" :class="{ 'has-racial-bonus': finalAbility(field.key) !== baseAbilities[field.key] }"><CInput type="number" min="1" max="30" step="1" :label="field.label" :disabled="disabled" :model-value="baseAbilities[field.key]" @update:model-value="updateAbility(field.key, $event)" /><div class="ability-result"><span>Итог <b>{{ finalAbility(field.key) }}</b></span><strong>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</strong></div><span v-if="finalAbility(field.key) !== baseAbilities[field.key]" class="ability-source">Раса / подраса {{ signedModifier(finalAbility(field.key) - baseAbilities[field.key]) }}</span><span v-else class="ability-source">Без бонуса происхождения</span></article></div>
            </template>

            <template v-else-if="currentStep === 7">
              <div class="skill-step-summary"><span :class="{ 'selection-complete': classSkillsRemaining === 0 }">Класс: <b>{{ selectedCount }} / {{ selectedClass.skillChoiceCount }}</b><small>{{ classSkillsRemaining ? `Осталось выбрать: ${classSkillsRemaining}` : 'Выбор завершён' }}</small></span><span :class="{ 'selection-complete': raceSkillsRemaining === 0 }">Раса: <b>{{ raceSelectedCount }} / {{ selectedRace.skillChoices?.count ?? 0 }}</b><small>{{ (selectedRace.skillChoices?.count ?? 0) === 0 ? 'Нет выбора' : raceSkillsRemaining ? `Осталось выбрать: ${raceSkillsRemaining}` : 'Выбор завершён' }}</small></span><span>Предыстория: <b>{{ selectedBackground.skillProficiencies.length }}</b><small>Задано правилами</small></span></div>
              <div class="creation-skills-list"><article v-for="skill in props.character.skills" :key="skill.id" class="creation-skill-row" :class="{ 'skill-is-owned': currentOwnedSkills.some((entry) => entry.id === skill.id) }"><div class="creation-skill-name"><strong>{{ skill.name }}</strong><span>{{ ABILITY_FIELDS.find((field) => field.key === skill.ability)?.label ?? 'Характеристика не задана' }} · итог {{ currentOwnedSkills.find((entry) => entry.id === skill.id)?.bonus ?? signedModifier(abilityModifier(skill.ability ? finalAbility(skill.ability) : 10)) }}</span></div><div class="creation-skill-sources"><span v-for="source in currentOwnedSkills.find((entry) => entry.id === skill.id)?.sources ?? []" :key="source" class="source-badge" :class="`source-${source}`">{{ sourceLabel(source) }}</span><span v-if="!currentOwnedSkills.some((entry) => entry.id === skill.id)" class="source-none">Нет владения</span></div><div class="creation-skill-actions"><label v-if="selectedClass.skillOptions.includes(skill.id)" class="skill-choice-control"><input type="checkbox" :checked="selectedSkillIds.includes(skill.id)" :disabled="disabled || (!selectedSkillIds.includes(skill.id) && selectedCount >= selectedClass.skillChoiceCount)" @change="toggleClassSkill(skill.id)" />Класс</label><label v-if="selectedRace.skillChoices?.options.includes(skill.id)" class="skill-choice-control"><input type="checkbox" :checked="raceSkillChoices.includes(skill.id)" :disabled="disabled || (!raceSkillChoices.includes(skill.id) && raceSelectedCount >= selectedRace.skillChoices.count)" @change="toggleRaceSkill(skill.id)" />Раса</label><span v-if="selectedBackground.skillProficiencies.includes(skill.id)" class="fixed-source-label">Предыстория</span></div></article></div>
              <p class="creation-source-explainer">Выберите ровно указанное количество навыков класса и расы. После достижения лимита остальные варианты блокируются. Владения складываются по источникам: один навык может одновременно происходить от класса, расы и предыстории.</p>
            </template>

            <template v-else-if="currentStep === 8">
              <div class="equipment-choice-group"><div class="equipment-group-heading"><h3>Набор класса · {{ selectedClass.label }}</h3><p class="section-note">Выберите один вариант — его предметы попадут в инвентарь при создании.</p></div><div class="selection-grid equipment-selection-grid"><button v-for="kit in classEquipmentOptions" :key="kit.id" type="button" class="selection-card equipment-card" :class="{ selected: classEquipmentId === kit.id }" :aria-pressed="classEquipmentId === kit.id" :disabled="disabled" @click="selectClassKit(kit.id)"><span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">⚔</span><span v-if="classEquipmentId === kit.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ kit.label }}</strong><span class="equipment-card-items">{{ kit.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ') }}</span><span class="selection-description">{{ kit.items.length }} позиций снаряжения</span></button></div></div>
              <div class="equipment-choice-group"><div class="equipment-group-heading"><h3>Набор предыстории · {{ selectedBackground.label }}</h3><p class="section-note">Дополнит, а не заменит ваши текущие предметы.</p></div><div class="selection-grid equipment-selection-grid"><button v-for="kit in backgroundEquipmentOptions" :key="kit.id" type="button" class="selection-card equipment-card" :class="{ selected: backgroundEquipmentId === kit.id }" :aria-pressed="backgroundEquipmentId === kit.id" :disabled="disabled" @click="selectBackgroundKit(kit.id)"><span class="selection-card-top"><span class="selection-sigil" aria-hidden="true">✧</span><span v-if="backgroundEquipmentId === kit.id" class="selection-check" aria-label="Выбрано">✓</span></span><strong>{{ kit.label }}</strong><span class="equipment-card-items">{{ kit.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ') }}</span></button></div></div>
              <div class="equipment-preview-strip"><strong>Будет добавлено в инвентарь</strong><span v-for="(item, index) in previewEquipment" :key="`${item.source}-${item.name}-${index}`">{{ item.name }} × {{ item.quantity }} <small>{{ item.source }}</small></span></div>
            </template>

            <template v-else>
              <div v-if="!completed" class="creation-review"><div class="review-medallion" aria-hidden="true">✦</div><p class="eyebrow">Последняя проверка</p><h3>{{ name.trim() || 'Безымянный герой' }}</h3><p class="review-identity">{{ selectedRace.label }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span> · {{ selectedClass.label }} · {{ selectedBackground.label }}</p><div class="review-abilities"><span v-for="field in ABILITY_FIELDS" :key="field.key"><small>{{ field.label.slice(0, 3) }}</small><b>{{ finalAbility(field.key) }}</b><em>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</em></span></div><div class="review-bottom"><div><strong>Особенности</strong><p>{{ previewFeatures.slice(0, 5).join(' · ') }}</p></div><div><strong>Снаряжение</strong><p>{{ previewEquipment.map((item) => `${item.name} × ${item.quantity}`).join(' · ') }}</p></div></div><div class="creation-callout"><span aria-hidden="true">✧</span><p>После создания изменения останутся черновиком. Используйте общую кнопку «Сохранить» на листе, чтобы записать персонажа.</p></div></div>
              <div v-else class="creation-finished"><div class="finished-seal" aria-hidden="true">✦</div><p class="eyebrow">Путь начинается</p><h3>Персонаж готов</h3><p>{{ name }} — {{ selectedRace.label }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span>, {{ selectedClass.label }}.</p><div class="finished-actions"><CBtn color-type="primary" @click="emit('back-to-sheet')">Открыть лист персонажа</CBtn><CBtn @click="completed = false">Изменить</CBtn></div></div>
            </template>

            <footer v-if="!completed" class="creation-navigation"><CBtn :disabled="disabled || currentStep === 1" @click="previousStep">Назад</CBtn><span class="navigation-step-caption">{{ currentStep }} / {{ stepNames.length }}</span><CBtn v-if="currentStep < stepNames.length" color-type="accent" :disabled="disabled || !canContinue" @click="nextStep">Далее</CBtn><CBtn v-else color-type="primary" :disabled="disabled || !canContinue" @click="applyCreation">Создать персонажа</CBtn></footer>
          </section>
        </Transition>
      </div>

      <aside class="character-preview" :class="{ compact: currentStep !== 9 }" aria-label="Предпросмотр персонажа" aria-live="polite">
        <div class="preview-bookmark">Лист героя · предпросмотр</div>
        <div class="preview-portrait"><span class="portrait-frame"><span>{{ initials }}</span></span><span class="portrait-caption">Портрет появится позже</span></div>
        <div class="preview-identity"><p class="eyebrow">Новый искатель приключений</p><h2>{{ name.trim() || 'Имя героя' }}</h2><p>{{ selectedRace.label }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span></p><div class="preview-class-row"><span>{{ selectedClass.label }}</span><span>Уровень {{ props.character.level }}</span></div><small>Предыстория: {{ selectedBackground.label }}</small></div>
        <div class="preview-divider"><span>Характеристики</span></div>
        <div class="preview-ability-grid"><div v-for="field in ABILITY_FIELDS" :key="field.key"><small>{{ field.label }}</small><b>{{ finalAbility(field.key) }}</b><span>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</span></div></div>
        <div class="preview-section"><h3>Владения</h3><div v-if="currentOwnedSkills.length" class="preview-badges"><span v-for="skill in currentOwnedSkills.slice(0, 8)" :key="skill.id" class="preview-skill"><b>{{ skillLabels[skill.id] ?? skill.name }}</b><small>{{ skill.sources.map(sourceLabel).join(' + ') }}</small></span></div><p v-else class="preview-muted">Выберите навыки, чтобы увидеть владения.</p></div>
        <div class="preview-section"><h3>Особенности</h3><ul class="preview-feature-list"><li v-for="feature in previewFeatures.slice(0, currentStep === 9 ? 8 : 3)" :key="feature">{{ feature }}</li></ul></div>
        <div class="preview-section"><h3>Стартовое снаряжение</h3><ul v-if="previewEquipment.length" class="preview-equipment-list"><li v-for="(item, index) in previewEquipment.slice(0, currentStep === 9 ? 8 : 4)" :key="`${item.source}-${item.name}-${index}`">{{ item.name }} <span>× {{ item.quantity }}</span></li></ul><p v-else class="preview-muted">Пока не выбрано</p></div>
        <p class="preview-draft-note">Изменения пока не сохранены</p>
      </aside>
    </div>
  </div>
</template>
