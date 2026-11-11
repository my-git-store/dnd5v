<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { ABILITY_FIELDS } from '@/data/characterFields.ts'
import {
    DND5E_BACKGROUNDS,
    DND5E_CLASSES,
    DND5E_RACES,
    findBackground,
    findClass,
    findRace,
    findSubrace,
    subracesForRace,
    type Dnd5eBackgroundOption,
    type Dnd5eClassOption,
    type Dnd5eRaceOption,
} from '@/data/dnd5eOptions.ts'
import {
    RULES_2024_BACKGROUNDS,
    RULES_2024_CLASSES,
    RULES_2024_SPECIES,
    findRules2024Background,
    findRules2024Class,
    findRules2024Feat,
    findSpecies2024,
    getRules2024ClassFeatures,
} from '@/data/rules2024/index.ts'
import { abilityModifier, signedModifier } from '@/domain/abilityModifier.ts'
import { calculateSkillBonus } from '@/domain/skillBonus.ts'
import type { AbilityKey, CharacterAbilities, CharacterGender } from '@/types/character.ts'
import type { CharacterRuleset } from '@/types/character.ts'
import type { CharacterCreationPayload } from '@/domain/characterCreation.ts'
import type { CharacterSheetView } from '@/types/characterView.ts'
import { classIconFor } from '@/data/classIcons.ts'
import { backgroundIconFor } from '@/data/backgroundIcons.ts'
import { speciesIconFor } from '@/data/speciesIcons.ts'

const props = defineProps<{
    character: CharacterSheetView
    disabled?: boolean
    hidePreview?: boolean
    creationError?: string | null
}>()

const emit = defineEmits<{ create: [payload: CharacterCreationPayload]; 'back-to-sheet': [] }>()

const stepNames = [
    'Имя',
    'Раса',
    'Предыстория',
    'Подраса',
    'Класс',
    'Характеристики',
    'Навыки',
    'Снаряжение',
    'Готово',
]

const stepDescriptions = [
    'Дайте герою имя и задайте его первое впечатление.',
    'Выберите народ и познакомьтесь с его наследием.',
    'Выберите прошлое героя, владения и стартовый набор.',
    'Уточните традицию и черты своей общины.',
    'Выберите путь и таланты первого уровня.',
    'Распределите исходные значения характеристик.',
    'Выберите навыки и проверьте источники владения.',
    'Подготовьте снаряжение, с которым начнётся путь.',
    'Проверьте образ героя и примените выборы к листу.',
]

const modernStepNames = [
    'Имя',
    'Вид',
    'Предыстория',
    'Особенности вида',
    'Класс',
    'Характеристики',
    'Навыки',
    'Снаряжение',
    'Готово',
]

const modernStepDescriptions = [
    'Дайте герою имя и выберите редакцию правил.',
    'Выберите вид и познакомьтесь с его наследием.',
    'Выберите прошлое героя, бонусы характеристик и черту происхождения.',
    'Проверьте наследие вида, выбранное на предыдущем шаге.',
    'Выберите класс и его особенности первого уровня.',
    'Распределите исходные значения характеристик.',
    'Выберите навыки класса и проверьте источники владения.',
    'Подготовьте снаряжение, с которым начнётся путь.',
    'Проверьте образ героя и примените выборы к листу.',
]

function stepLabel(index: number) {
    return ruleset.value === '2024' ? (modernStepNames[index] ?? '') : (stepNames[index] ?? '')
}
function stepDescription(index: number) {
    return ruleset.value === '2024'
        ? (modernStepDescriptions[index] ?? '')
        : (stepDescriptions[index] ?? '')
}

const currentStep = ref(1)

// Character creation is always a new draft. The sheet remains available for
// preview and skill metadata, but its saved choices must never prefill this flow.
const ruleset = ref<CharacterRuleset>('2024')

const highestUnlockedStep = ref(1)

const completed = ref(false)

const initialRuleset = ruleset.value

const raceId = ref(RULES_2024_SPECIES[0]!.id)

const subraceId = ref('')

const classId = ref(RULES_2024_CLASSES[0]!.id)

const backgroundId = ref(RULES_2024_BACKGROUNDS[0]?.id ?? '')

const backgroundEquipmentId = ref(RULES_2024_BACKGROUNDS[0]?.equipmentOptions[0]?.id ?? '')

const backgroundAbilityChoices = ref<AbilityKey[]>([
    ...(RULES_2024_BACKGROUNDS[0]?.abilityOptions ?? []).slice(0, 3),
])

const originAbilityFocus = ref<AbilityKey | undefined>(RULES_2024_BACKGROUNDS[0]?.abilityOptions[0])

const speciesChoices = ref<Record<string, string[]>>({})

const name = ref('')

function updateName(value: unknown) {
    name.value = String(value ?? '')
    completed.value = false
}

function updateGender(value: CharacterGender) {
    gender.value = value
    completed.value = false
}

const gender = ref<CharacterGender>('female')

const subclass = ref('')

const alignment = ref('')

const initialClass =
    initialRuleset === '2024' ? classAsLegacy(classId.value) : findClass(classId.value)

const selectedSkillIds = ref<string[]>([])

const raceSkillChoices = ref<string[]>([])

const raceAbilityChoices = ref<AbilityKey[]>([])

const baseAbilities = reactive<CharacterAbilities>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
})

const classEquipmentId = ref(initialClass.equipmentOptions?.[0]?.id ?? '')

function speciesAsLegacy(id: string): Dnd5eRaceOption {
    const species = findSpecies2024(id)
    return {
        id: species.id,
        label: species.name,
        profile: {
            name: species.name,
            subrace: '',
            size: species.size,
            speed: species.speed,
            abilityBonuses: {},
            traits: [...species.traits],
            languages: [...species.languages],
        },
    }
}
function classAsLegacy(id: string): Dnd5eClassOption {
    const option = findRules2024Class(id)
    return {
        id: option.id,
        label: option.label,
        description: option.description,
        hitDie: option.hitDie,
        primaryAbility: option.primaryAbility,
        primaryAbilities: [...option.primaryAbilities],
        icon: option.icon,
        iconByGender: option.iconByGender,
        spellcastingAbility: option.spellcastingAbility,
        spellProgressionType: option.spellProgressionType,
        savingThrowKeys: [...option.savingThrowKeys],
        savingThrowProficiencies: [...option.savingThrowProficiencies],
        skillChoiceCount: option.skillChoiceCount,
        skillOptions: [...option.skillOptions],
        skillChoices: {
            count: option.skillChoices.count,
            options: [...option.skillChoices.options],
        },
        features: [...option.features],
        proficiencies: [...option.proficiencies],
        weaponProficiencies: [...option.weaponProficiencies],
        armorProficiencies: [...option.armorProficiencies],
        equipmentOptions: option.equipmentOptions,
        startingEquipment: option.startingEquipment,
    }
}
type CreationBackgroundOption = Dnd5eBackgroundOption & {
    icon?: string
    abilityOptions?: AbilityKey[]
    originFeatId?: string
    originFeatLabel?: string
    originFeatDescription?: string
}

function backgroundAsCreation(id: string): CreationBackgroundOption {
    if (ruleset.value === '2024') {
        const background = findRules2024Background(id)

        const feat = findRules2024Feat(background.originFeatId)
        return {
            id: background.id,
            label: background.label,
            description: background.description,
            icon: background.icon ?? backgroundIconFor(background.id),
            skillProficiencies: [...background.skillProficiencies],
            toolProficiencies: [...background.toolProficiencies],
            languages: [...background.languages],
            feature: background.feature,
            equipmentOptions: background.equipmentOptions,
            abilityOptions: [...background.abilityOptions],
            originFeatId: background.originFeatId,
            originFeatLabel: feat?.label,
            originFeatDescription: feat?.description,
        }
    }
    return findBackground(id)
}

const raceOptions = computed<Dnd5eRaceOption[]>(() =>
    ruleset.value === '2024'
        ? RULES_2024_SPECIES.map(species => speciesAsLegacy(species.id))
        : DND5E_RACES,
)

const classOptions = computed<Dnd5eClassOption[]>(() =>
    ruleset.value === '2024'
        ? RULES_2024_CLASSES.map(item => classAsLegacy(item.id))
        : DND5E_CLASSES,
)

const backgroundOptions = computed<CreationBackgroundOption[]>(() =>
    ruleset.value === '2024'
        ? RULES_2024_BACKGROUNDS.map(item => backgroundAsCreation(item.id))
        : DND5E_BACKGROUNDS,
)

const selectedRace = computed(() =>
    ruleset.value === '2024' ? speciesAsLegacy(raceId.value) : findRace(raceId.value),
)

const selected2024Species = computed(() => findSpecies2024(raceId.value))

const selectedSpeciesIcon = computed(() =>
    ruleset.value === '2024' ? speciesIconFor(raceId.value) : undefined,
)

const selectedSubrace = computed(() =>
    ruleset.value === '2024' ? undefined : findSubrace(raceId.value, subraceId.value),
)

const selectedClass = computed(() =>
    ruleset.value === '2024' ? classAsLegacy(classId.value) : findClass(classId.value),
)

const selectedBackground = computed(
    () =>
        backgroundOptions.value.find(item => item.id === backgroundId.value) ??
        backgroundOptions.value[0]!,
)

const selectedModernBackground = computed(() =>
    ruleset.value === '2024' ? findRules2024Background(backgroundId.value) : undefined,
)

const selectedBackgroundIcon = computed(() =>
    ruleset.value === '2024'
        ? (selectedBackground.value.icon ?? backgroundIconFor(backgroundId.value))
        : undefined,
)

const availableSubraces = computed(() =>
    ruleset.value === '2024' ? [] : subracesForRace(raceId.value),
)

const classEquipmentOptions = computed(() => selectedClass.value.equipmentOptions ?? [])

const backgroundEquipmentOptions = computed(() => selectedBackground.value?.equipmentOptions ?? [])

const rulesetOptions = [
    { value: '2024', label: 'D&D 2024 / 5.5' },
    { value: '2014', label: 'D&D 2014' },
]

const choiceOptions = (values: string[]) => [
    { value: '', label: 'Выберите вариант', disabled: true },
    ...values.map(value => ({ value, label: value })),
]

const skillLabels = computed(
    () =>
        Object.fromEntries(props.character.skills.map(skill => [skill.id, skill.name])) as Record<
            string,
            string
        >,
)

const selectedCount = computed(
    () => selectedSkillIds.value.filter(id => selectedClass.value.skillOptions.includes(id)).length,
)

const raceSelectedCount = computed(
    () =>
        raceSkillChoices.value.filter(id => selectedRace.value.skillChoices?.options.includes(id))
            .length,
)

const classSkillsRemaining = computed(() =>
    Math.max(0, selectedClass.value.skillChoiceCount - selectedCount.value),
)

const raceSkillsRemaining = computed(() =>
    Math.max(0, (selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value),
)

const selectableSkills = computed(() =>
    props.character.skills.filter(
        skill =>
            selectedClass.value.skillOptions.includes(skill.id) ||
            selectedRace.value.skillChoices?.options.includes(skill.id),
    ),
)

const backgroundChoiceIssue = computed(() => {
    if (!backgroundId.value) return 'Выберите предысторию, чтобы продолжить.'
    if (ruleset.value !== '2024') return ''
    const background = selectedModernBackground.value

    const allowed = background?.abilityOptions ?? []

    const validChoices =
        backgroundAbilityChoices.value.length === Math.min(3, allowed.length) &&
        backgroundAbilityChoices.value.every(key => allowed.includes(key))
    if (!validChoices) return 'Выберите три характеристики для бонусов предыстории.'
    if (
        !originAbilityFocus.value ||
        !backgroundAbilityChoices.value.includes(originAbilityFocus.value)
    )
        return 'Выберите характеристику, которая получит бонус +2.'
    return ''
})

function spellProgressionLabel(value: Dnd5eClassOption['spellProgressionType']): string {
    return (
        (
            {
                none: 'Нет',
                prepared: 'Подготовка',
                known: 'Известные заклинания',
                pact: 'Магия договора',
            } as Record<string, string>
        )[value ?? ''] ?? 'Не указано'
    )
}

const speciesChoiceIssue = computed(() => {
    if (ruleset.value !== '2024') return ''
    const missing = selected2024Species.value.choices.find(
        choice => (speciesChoices.value[choice.id]?.length ?? 0) < choice.minSelections,
    )
    return missing ? `Выберите вариант: ${missing.label}.` : ''
})

const finalAbility = (key: AbilityKey) => {
    if (ruleset.value === '2024') return baseAbilities[key]
    return (
        baseAbilities[key] +
        (selectedRace.value.profile.abilityBonuses[key] ?? 0) +
        (selectedSubrace.value?.abilityBonuses[key] ?? 0) +
        (selectedRace.value.abilityChoices && raceAbilityChoices.value.includes(key)
            ? selectedRace.value.abilityChoices.bonus
            : 0)
    )
}

const initials = computed(
    () =>
        name.value
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0]?.toLocaleUpperCase('ru-RU') ?? '')
            .join('') || '✦',
)

const derivedRaceSkills = computed(() =>
    ruleset.value === '2024'
        ? []
        : [
              ...new Set([
                  ...(selectedRace.value.skillProficiencies ?? []),
                  ...raceSkillChoices.value,
                  ...(selectedSubrace.value?.skillProficiencies ?? []),
              ]),
          ],
)

const currentOwnedSkills = computed(() =>
    props.character.skills
        .map(skill => {
            const sources = new Set<string>()
            if (derivedRaceSkills.value.includes(skill.id)) sources.add('race')
            if (selectedBackground.value.skillProficiencies.includes(skill.id))
                sources.add('background')
            if (selectedSkillIds.value.includes(skill.id)) sources.add('class')
            for (const source of skill.proficiencySources ?? [])
                if (source === 'manual' || source === 'feat') sources.add(source)
            const proficiency = sources.size > 0 ? 'proficient' : 'none'

            const bonus = calculateSkillBonus(
                {
                    ...skill,
                    proficiency,
                    calculationMode: 'computed',
                    additionalBonus: skill.additionalBonus,
                },
                {
                    ...baseAbilities,
                    ...Object.fromEntries(
                        ABILITY_FIELDS.map(field => [field.key, finalAbility(field.key)]),
                    ),
                },
                props.character.level,
            )
            return { ...skill, sources: [...sources], proficiency, bonus }
        })
        .filter(skill => skill.sources.length > 0),
)

const selectedClassKit = computed(() =>
    classEquipmentOptions.value.find(option => option.id === classEquipmentId.value),
)

const selectedBackgroundKit = computed(() =>
    backgroundEquipmentOptions.value.find(option => option.id === backgroundEquipmentId.value),
)

const previewEquipment = computed(() => [
    ...(selectedBackgroundKit.value?.items.map(item => ({ ...item, source: 'Предыстория' })) ?? []),
    ...(selectedClassKit.value?.items.map(item => ({ ...item, source: 'Класс' })) ?? []),
])

const previewClassFeatures = computed(() =>
    ruleset.value === '2024'
        ? getRules2024ClassFeatures(classId.value, props.character.level).map(
              feature => feature.name,
          )
        : selectedClass.value.features,
)

const previewFeatures = computed(() =>
    [
        ...selectedRace.value.profile.traits,
        ...(selectedSubrace.value?.traits ?? []),
        ...previewClassFeatures.value,
    ].filter(Boolean),
)

const stepProgress = computed(() => Math.round((currentStep.value / stepNames.length) * 100))

const abilityError = computed(() =>
    ABILITY_FIELDS.some(
        field =>
            !Number.isInteger(baseAbilities[field.key]) ||
            baseAbilities[field.key] < 1 ||
            baseAbilities[field.key] > 30,
    ),
)

const stepIssue = computed(() => {
    if (currentStep.value === 1 && !name.value.trim())
        return 'Введите имя персонажа, чтобы продолжить.'
    if (currentStep.value === 2 && speciesChoiceIssue.value) return speciesChoiceIssue.value
    if (currentStep.value === 3 && backgroundChoiceIssue.value) return backgroundChoiceIssue.value
    if (currentStep.value === 4 && availableSubraces.value.length > 0 && !selectedSubrace.value)
        return 'Выберите подрасу для выбранной расы.'
    if (currentStep.value === 6 && abilityError.value)
        return 'Каждая характеристика должна быть целым числом от 1 до 30.'
    if (currentStep.value === 7 && selectedCount.value !== selectedClass.value.skillChoiceCount)
        return `Выберите навыки класса: ${selectedClass.value.skillChoiceCount - selectedCount.value > 0 ? `осталось ${selectedClass.value.skillChoiceCount - selectedCount.value}` : `уберите лишние ${selectedCount.value - selectedClass.value.skillChoiceCount}`}.`
    if (
        currentStep.value === 7 &&
        raceSelectedCount.value !== (selectedRace.value.skillChoices?.count ?? 0)
    )
        return `Выберите навыки вида: осталось ${(selectedRace.value.skillChoices?.count ?? 0) - raceSelectedCount.value}`
    if (currentStep.value === 8 && classEquipmentOptions.value.length && !selectedClassKit.value)
        return 'Выберите один набор снаряжения класса.'
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
function previousStep() {
    if (currentStep.value > 1) goToStep(currentStep.value - 1)
}
function updateRace(id: string) {
    raceId.value = id
    subraceId.value = ruleset.value === '2024' ? '' : (subracesForRace(id)[0]?.id ?? '')
    raceAbilityChoices.value =
        selectedRace.value.abilityChoices?.options.slice(
            0,
            selectedRace.value.abilityChoices.count,
        ) ?? []
    raceSkillChoices.value = []
    speciesChoices.value = {}
    highestUnlockedStep.value = Math.min(
        highestUnlockedStep.value,
        ruleset.value === '2024' && speciesChoiceIssue.value ? 2 : 3,
    )
    completed.value = false
}
function updateBackground(id: string) {
    backgroundId.value = id
    const background = backgroundAsCreation(id)
    backgroundEquipmentId.value = background.equipmentOptions[0]?.id ?? ''
    backgroundAbilityChoices.value =
        ruleset.value === '2024' ? [...(background.abilityOptions ?? []).slice(0, 3)] : []
    originAbilityFocus.value = ruleset.value === '2024' ? background.abilityOptions?.[0] : undefined
    highestUnlockedStep.value = Math.min(
        highestUnlockedStep.value,
        backgroundChoiceIssue.value ? 3 : 4,
    )
    completed.value = false
}
function updateClass(id: string) {
    classId.value = id
    const nextClass = ruleset.value === '2024' ? classAsLegacy(id) : findClass(id)
    selectedSkillIds.value = [
        ...new Set(
            selectedSkillIds.value.filter(skillId => nextClass.skillOptions.includes(skillId)),
        ),
    ].slice(0, nextClass.skillChoiceCount)
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
    if (selectedSkillIds.value.includes(id))
        selectedSkillIds.value = selectedSkillIds.value.filter(item => item !== id)
    else if (selectedCount.value < selectedClass.value.skillChoiceCount)
        selectedSkillIds.value = [...new Set([...selectedSkillIds.value, id])]
    completed.value = false
}
function toggleRaceSkill(id: string) {
    const options = selectedRace.value.skillChoices?.options ?? []

    const limit = selectedRace.value.skillChoices?.count ?? 0
    if (!options.includes(id)) return
    if (raceSkillChoices.value.includes(id))
        raceSkillChoices.value = raceSkillChoices.value.filter(item => item !== id)
    else if (raceSelectedCount.value < limit)
        raceSkillChoices.value = [...new Set([...raceSkillChoices.value, id])]
    completed.value = false
}
function isSkillChoiceSelected(id: string) {
    return selectedSkillIds.value.includes(id) || raceSkillChoices.value.includes(id)
}
function canSelectSkill(id: string) {
    const classAvailable =
        selectedClass.value.skillOptions.includes(id) &&
        selectedCount.value < selectedClass.value.skillChoiceCount

    const raceAvailable =
        selectedRace.value.skillChoices?.options.includes(id) &&
        raceSelectedCount.value < (selectedRace.value.skillChoices?.count ?? 0)
    return classAvailable || raceAvailable
}
function toggleSelectableSkill(id: string) {
    const classOption = selectedClass.value.skillOptions.includes(id)

    const raceOption = selectedRace.value.skillChoices?.options.includes(id) ?? false
    if (
        classOption &&
        (selectedSkillIds.value.includes(id) ||
            !raceOption ||
            selectedCount.value < selectedClass.value.skillChoiceCount)
    ) {
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
function selectSubrace(id: string) {
    subraceId.value = id
    completed.value = false
}
function selectClassKit(id: string) {
    classEquipmentId.value = id
    completed.value = false
}
function updateRuleset(value: CharacterRuleset) {
    ruleset.value = value
    if (value === '2024') {
        raceId.value = RULES_2024_SPECIES[0]!.id
        classId.value = RULES_2024_CLASSES[0]!.id
        backgroundId.value = RULES_2024_BACKGROUNDS[0]?.id ?? ''
    } else {
        raceId.value = DND5E_RACES[0]!.id
        classId.value = DND5E_CLASSES[DND5E_CLASSES.length - 1]!.id
        backgroundId.value = DND5E_BACKGROUNDS[0]?.id ?? ''
    }
    const background = backgroundAsCreation(backgroundId.value)
    backgroundEquipmentId.value = background.equipmentOptions[0]?.id ?? ''
    backgroundAbilityChoices.value =
        value === '2024' ? [...(background.abilityOptions ?? []).slice(0, 3)] : []
    originAbilityFocus.value = value === '2024' ? background.abilityOptions?.[0] : undefined
    subraceId.value = ''
    classEquipmentId.value = selectedClass.value.equipmentOptions?.[0]?.id ?? ''
    selectedSkillIds.value = []
    raceSkillChoices.value = []
    speciesChoices.value = {}
    highestUnlockedStep.value = 1
    completed.value = false
}
function updateRulesetValue(value: string | null) {
    updateRuleset(value === '2014' ? '2014' : '2024')
}
function selectSpeciesChoice(choiceId: string, value: string | null) {
    if (!value) return
    speciesChoices.value = { ...speciesChoices.value, [choiceId]: [value] }
    if (!speciesChoiceIssue.value)
        highestUnlockedStep.value = Math.max(highestUnlockedStep.value, 3)
    completed.value = false
}
function toggleBackgroundAbility(key: AbilityKey) {
    const options = selectedBackground.value?.abilityOptions ?? []
    if (!options.includes(key)) return
    if (backgroundAbilityChoices.value.includes(key)) {
        backgroundAbilityChoices.value = backgroundAbilityChoices.value.filter(item => item !== key)
        if (originAbilityFocus.value === key)
            originAbilityFocus.value = backgroundAbilityChoices.value[0]
    } else if (backgroundAbilityChoices.value.length < 3) {
        backgroundAbilityChoices.value = [...backgroundAbilityChoices.value, key]
    }
    highestUnlockedStep.value = Math.min(
        highestUnlockedStep.value,
        backgroundChoiceIssue.value ? 3 : 4,
    )
    completed.value = false
}
function selectOriginAbilityFocus(key: AbilityKey) {
    if (backgroundAbilityChoices.value.includes(key)) originAbilityFocus.value = key
    highestUnlockedStep.value = Math.min(
        highestUnlockedStep.value,
        backgroundChoiceIssue.value ? 3 : 4,
    )
    completed.value = false
}
function selectBackgroundKit(id: string) {
    backgroundEquipmentId.value = id
    completed.value = false
}
function hideBrokenAsset(event: Event) {
    const image = event.currentTarget as HTMLImageElement
    image.hidden = true
    image.parentElement
        ?.querySelector<HTMLElement>('[data-asset-fallback]')
        ?.removeAttribute('hidden')
}
function raceBonusLines(raceIdValue: string) {
    if (ruleset.value === '2024') return ['Бонусы характеристик задаются исходными значениями']
    const race = findRace(raceIdValue)
    return Object.entries(race.profile.abilityBonuses).map(
        ([key, value]) =>
            `${ABILITY_FIELDS.find(field => field.key === key)?.label} ${signedModifier(value ?? 0)}`,
    )
}
function subraceBonusLines(subraceIdValue: string) {
    const subrace = findSubrace(raceId.value, subraceIdValue)
    return Object.entries(subrace?.abilityBonuses ?? {}).map(
        ([key, value]) =>
            `${ABILITY_FIELDS.find(field => field.key === key)?.label} ${signedModifier(value ?? 0)}`,
    )
}
function sourceLabel(source: string) {
    return (
        (
            {
                race: 'Вид',
                class: 'Класс',
                background: 'Предыстория',
                feat: 'Черта',
                manual: 'Вручную',
            } as Record<string, string>
        )[source] ?? source
    )
}
function applyCreation() {
    if (stepIssue.value || !name.value.trim()) return
    const payload: CharacterCreationPayload = {
        ruleset: ruleset.value,
        gender: gender.value,
        speciesId: ruleset.value === '2024' ? raceId.value : undefined,
        speciesChoices:
            ruleset.value === '2024'
                ? (JSON.parse(JSON.stringify(speciesChoices.value)) as Record<string, string[]>)
                : undefined,
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
        originFeatId:
            ruleset.value === '2024' ? selectedModernBackground.value?.originFeatId : undefined,
        originAbilityChoices:
            ruleset.value === '2024' ? [...backgroundAbilityChoices.value] : undefined,
        originAbilityFocus: ruleset.value === '2024' ? originAbilityFocus.value : undefined,
        classEquipmentId: classEquipmentId.value || undefined,
        backgroundEquipmentId: backgroundEquipmentId.value || undefined,
    }
    emit('create', payload)
    completed.value = true
}
</script>

<template>
    <div class="c-tab-content creation-tab">
        <header class="creation-hero c-sheet-section">
            <div class="creation-hero-mark" aria-hidden="true">✦</div>
            <div class="creation-hero-copy">
                <p class="c-eyebrow">Хроники начинаются здесь</p>
                <h1>Создание персонажа</h1>
                <p class="c-section-note">{{ stepDescription(currentStep - 1) }}</p>
            </div>
            <div class="creation-progress-copy">
                <strong>Шаг {{ currentStep }} из {{ stepNames.length }}</strong
                ><span>{{ stepLabel(currentStep - 1) }}</span>
            </div>
            <div
                class="creation-progress-track"
                role="progressbar"
                :aria-valuenow="currentStep"
                :aria-valuemin="1"
                :aria-valuemax="stepNames.length"
                :aria-label="`Шаг ${currentStep} из ${stepNames.length}`"
            >
                <span :style="{ width: `${stepProgress}%` }"></span>
            </div>
        </header>

        <nav class="creation-step-nav" aria-label="Шаги создания персонажа">
            <ol>
                <li
                    v-for="(_, index) in stepNames"
                    :key="index"
                    :class="{
                        active: currentStep === index + 1,
                        done: index + 1 < currentStep,
                        locked: index + 1 > highestUnlockedStep,
                    }"
                >
                    <button
                        type="button"
                        :disabled="disabled || index + 1 > highestUnlockedStep"
                        :aria-current="currentStep === index + 1 ? 'step' : undefined"
                        :aria-label="`${index + 1}. ${stepLabel(index)}${index + 1 > highestUnlockedStep ? ', недоступен' : index + 1 < currentStep ? ', завершён' : ''}`"
                        @click="goToStep(index + 1)"
                    >
                        <span class="step-number">{{
                            index + 1 < currentStep ? '✓' : index + 1
                        }}</span
                        ><span class="step-label">{{ stepLabel(index) }}</span>
                    </button>
                </li>
            </ol>
        </nav>

        <div class="creation-workspace">
            <div class="creation-main-column">
                <Transition name="creation-step" mode="out-in">
                    <section
                        :key="currentStep"
                        class="c-sheet-section creation-step-panel"
                        :aria-labelledby="`creation-step-title-${currentStep}`"
                    >
                        <div class="creation-panel-heading">
                            <div>
                                <p class="c-eyebrow">
                                    Этап {{ String(currentStep).padStart(2, '0') }}
                                </p>
                                <h2 :id="`creation-step-title-${currentStep}`">
                                    {{ stepLabel(currentStep - 1) }}
                                </h2>
                                <p class="c-section-note">{{ stepDescription(currentStep - 1) }}</p>
                            </div>
                            <span class="creation-rune" aria-hidden="true">{{
                                currentStep === 9 ? '✧' : '✦'
                            }}</span>
                        </div>

                        <div
                            v-if="stepIssue || props.creationError"
                            class="creation-error"
                            role="alert"
                        >
                            {{ props.creationError || stepIssue }}
                        </div>

                        <template v-if="currentStep === 1">
                            <div class="creator-grid creation-identity-fields">
                                <NFormItem label="Имя персонажа"
                                    ><NInput
                                        :value="name"
                                        :disabled="disabled"
                                        autocomplete="off"
                                        @update:value="updateName"
                                /></NFormItem>
                                <label class="c-compact-field creation-ruleset-field"
                                    >Редакция правил
                                    <NSelect
                                        class="c-select-control"
                                        :value="ruleset"
                                        :options="rulesetOptions"
                                        :disabled="disabled"
                                        @update:value="updateRulesetValue"
                                    />
                                </label>
                                <NFormItem label="Мировоззрение (необязательно)"
                                    ><NInput
                                        :value="alignment"
                                        :disabled="disabled"
                                        @update:value="alignment = String($event ?? '')"
                                /></NFormItem>
                                <NFormItem label="Подкласс (позже)"
                                    ><NInput
                                        :value="subclass"
                                        :disabled="disabled"
                                        @update:value="subclass = String($event ?? '')"
                                /></NFormItem>
                                <fieldset class="c-gender-choice">
                                    <legend>Пол персонажа</legend>
                                    <div
                                        class="c-gender-choice-options"
                                        role="radiogroup"
                                        aria-label="Пол персонажа"
                                    >
                                        <button
                                            type="button"
                                            class="c-gender-choice-button"
                                            :class="{ selected: gender === 'female' }"
                                            :aria-pressed="gender === 'female'"
                                            :disabled="disabled"
                                            @click="updateGender('female')"
                                        >
                                            Женский
                                        </button>
                                        <button
                                            type="button"
                                            class="c-gender-choice-button"
                                            :class="{ selected: gender === 'male' }"
                                            :aria-pressed="gender === 'male'"
                                            :disabled="disabled"
                                            @click="updateGender('male')"
                                        >
                                            Мужской
                                        </button>
                                    </div>
                                </fieldset>
                            </div>
                            <div class="creation-callout">
                                <span aria-hidden="true">✧</span>
                                <p>
                                    Имя можно изменить позднее. Ваш выбор пока остаётся в черновике
                                    листа.
                                </p>
                            </div>
                        </template>

                        <template v-else-if="currentStep === 2">
                            <p
                                v-if="ruleset === '2024'"
                                class="creation-source-explainer creation-race-bonus-note"
                            >
                                Бонусы характеристик задаются исходными значениями.
                            </p>
                            <div
                                class="selection-grid race-selection-grid"
                                role="group"
                                :aria-label="ruleset === '2024' ? 'Выберите вид' : 'Выберите расу'"
                            >
                                <button
                                    v-for="race in raceOptions"
                                    :key="race.id"
                                    type="button"
                                    class="selection-card"
                                    :class="{ selected: raceId === race.id }"
                                    :aria-pressed="raceId === race.id"
                                    :disabled="disabled"
                                    @click="updateRace(race.id)"
                                >
                                    <span class="selection-card-top"
                                        ><span
                                            v-if="ruleset === '2024'"
                                            class="species-icon"
                                            aria-hidden="true"
                                            ><span
                                                data-asset-fallback
                                                class="species-icon-fallback"
                                                :hidden="Boolean(speciesIconFor(race.id))"
                                                >{{ race.label.slice(0, 1) }}</span
                                            ><img
                                                v-if="speciesIconFor(race.id)"
                                                :src="speciesIconFor(race.id)"
                                                :alt="`Иконка вида «${race.label}»`"
                                                loading="lazy"
                                                @error="hideBrokenAsset" /></span
                                        ><span v-else class="selection-sigil" aria-hidden="true">{{
                                            race.label.slice(0, 1)
                                        }}</span
                                        ><span
                                            v-if="raceId === race.id"
                                            class="selection-check"
                                            aria-label="Выбрано"
                                            >✓</span
                                        ></span
                                    >
                                    <strong>{{ race.label }}</strong
                                    ><span class="selection-description"
                                        >{{ race.profile.size }} · скорость
                                        {{ race.profile.speed }} фт.</span
                                    ><span
                                        v-if="
                                            ruleset === '2024' && race.id === selected2024Species.id
                                        "
                                        class="selection-description"
                                        >{{ selected2024Species.description }}</span
                                    >
                                    <span v-if="ruleset !== '2024'" class="selection-bonuses"
                                        ><span
                                            v-for="bonus in raceBonusLines(race.id)"
                                            :key="bonus"
                                            >{{ bonus }}</span
                                        ></span
                                    >
                                    <span class="selection-traits"
                                        >Особенности: {{ race.profile.traits.join(' · ') }}</span
                                    >
                                    <span
                                        v-if="
                                            ruleset === '2024' && race.id === selected2024Species.id
                                        "
                                        class="selection-origin"
                                        >Языки:
                                        {{
                                            selected2024Species.languages.join(', ') || 'не указаны'
                                        }}</span
                                    >
                                    <span
                                        v-if="race.skillProficiencies?.length"
                                        class="selection-origin"
                                        >Владение:
                                        {{
                                            race.skillProficiencies
                                                .map(id => skillLabels[id] ?? id)
                                                .join(', ')
                                        }}</span
                                    >
                                </button>
                            </div>
                            <div
                                v-if="ruleset === '2024' && selected2024Species.choices.length"
                                class="species-choice-panel"
                            >
                                <div class="creation-panel-heading">
                                    <div>
                                        <p class="c-eyebrow">Наследие вида</p>
                                        <h3>Выберите особенность</h3>
                                        <p class="c-section-note">
                                            Выбор сохраняется как источник «Вид»; правила будут
                                            подключены отдельным слоем правил.
                                        </p>
                                    </div>
                                    <span class="creation-rune" aria-hidden="true">✧</span>
                                </div>
                                <div
                                    v-for="choice in selected2024Species.choices"
                                    :key="choice.id"
                                    class="species-choice-row"
                                >
                                    <div>
                                        <strong>{{ choice.label }}</strong>
                                        <p class="c-section-note">{{ choice.description }}</p>
                                    </div>
                                    <label class="c-compact-field"
                                        ><span class="sr-only">{{ choice.label }}</span
                                        ><NSelect
                                            class="c-select-control"
                                            :value="speciesChoices[choice.id]?.[0] ?? ''"
                                            :options="choiceOptions(choice.options)"
                                            :disabled="disabled"
                                            @update:value="selectSpeciesChoice(choice.id, $event)"
                                    /></label>
                                </div>
                            </div>
                        </template>

                        <template v-else-if="currentStep === 3">
                            <div
                                class="selection-grid background-selection-grid"
                                role="group"
                                aria-label="Выберите предысторию"
                            >
                                <button
                                    v-for="background in backgroundOptions"
                                    :key="background.id"
                                    type="button"
                                    class="selection-card"
                                    :class="{ selected: backgroundId === background.id }"
                                    :aria-pressed="backgroundId === background.id"
                                    :disabled="disabled"
                                    @click="updateBackground(background.id)"
                                >
                                    <span class="selection-card-top"
                                        ><span
                                            v-if="ruleset === '2024'"
                                            class="background-icon"
                                            aria-hidden="true"
                                            ><span
                                                data-asset-fallback
                                                class="background-icon-fallback"
                                                :hidden="Boolean(background.icon)"
                                                >{{ background.label.slice(0, 1) }}</span
                                            ><img
                                                v-if="background.icon"
                                                :src="background.icon"
                                                :alt="`Иконка предыстории «${background.label}»`"
                                                loading="lazy"
                                                @error="hideBrokenAsset" /></span
                                        ><span v-else class="selection-sigil" aria-hidden="true"
                                            >✧</span
                                        ><span
                                            v-if="backgroundId === background.id"
                                            class="selection-check"
                                            aria-label="Выбрано"
                                            >✓</span
                                        ></span
                                    >
                                    <strong>{{ background.label }}</strong>
                                    <span class="selection-description">{{
                                        background.description
                                    }}</span>
                                    <span class="selection-origin"
                                        >Навыки:
                                        {{
                                            background.skillProficiencies
                                                .map(id => skillLabels[id] ?? id)
                                                .join(' · ') || 'не указаны'
                                        }}</span
                                    >
                                    <span class="selection-origin"
                                        >Инструменты:
                                        {{
                                            background.toolProficiencies.join(' · ') || 'не указаны'
                                        }}</span
                                    >
                                    <span class="selection-origin">{{
                                        background.originFeatLabel
                                            ? `Черта происхождения: ${background.originFeatLabel}`
                                            : `Особенность: ${background.feature}`
                                    }}</span>
                                    <span
                                        v-if="background.languages.length"
                                        class="selection-origin"
                                        >Языки: {{ background.languages.join(' · ') }}</span
                                    >
                                </button>
                            </div>
                            <div v-if="ruleset === '2024'" class="origin-ability-choice">
                                <div>
                                    <strong>Бонусы характеристик</strong
                                    ><small
                                        >Выберите три характеристики. Одна выбранная характеристика
                                        получает +2, две другие — +1.</small
                                    >
                                </div>
                                <div
                                    class="origin-ability-options"
                                    role="group"
                                    aria-label="Характеристики предыстории"
                                >
                                    <button
                                        v-for="key in selectedModernBackground?.abilityOptions ??
                                        []"
                                        :key="key"
                                        type="button"
                                        class="origin-ability-option"
                                        :class="{
                                            selected: backgroundAbilityChoices.includes(key),
                                        }"
                                        :aria-pressed="backgroundAbilityChoices.includes(key)"
                                        :disabled="
                                            disabled ||
                                            (!backgroundAbilityChoices.includes(key) &&
                                                backgroundAbilityChoices.length >= 3)
                                        "
                                        @click="toggleBackgroundAbility(key)"
                                    >
                                        {{
                                            ABILITY_FIELDS.find(field => field.key === key)
                                                ?.label ?? key
                                        }}
                                    </button>
                                </div>
                                <div class="origin-ability-focus">
                                    <span>Бонус +2:</span
                                    ><button
                                        v-for="key in backgroundAbilityChoices"
                                        :key="`focus-${key}`"
                                        type="button"
                                        class="origin-ability-option"
                                        :class="{ selected: originAbilityFocus === key }"
                                        :aria-pressed="originAbilityFocus === key"
                                        :disabled="disabled"
                                        @click="selectOriginAbilityFocus(key)"
                                    >
                                        {{
                                            ABILITY_FIELDS.find(field => field.key === key)
                                                ?.label ?? key
                                        }}
                                    </button>
                                </div>
                                <small v-if="selectedModernBackground?.originFeatId"
                                    >Черта происхождения: {{ selectedBackground.originFeatLabel
                                    }}<span v-if="selectedBackground.originFeatDescription">
                                        — {{ selectedBackground.originFeatDescription }}</span
                                    ></small
                                >
                            </div>
                            <div
                                v-if="backgroundEquipmentOptions.length"
                                class="equipment-choice-group"
                            >
                                <div class="equipment-group-heading">
                                    <h3>Набор предыстории · {{ selectedBackground.label }}</h3>
                                    <p class="c-section-note">
                                        Выберите один вариант — его предметы и деньги попадут в
                                        инвентарь при создании.
                                    </p>
                                </div>
                                <div class="selection-grid equipment-selection-grid">
                                    <button
                                        v-for="kit in backgroundEquipmentOptions"
                                        :key="kit.id"
                                        type="button"
                                        class="selection-card equipment-card"
                                        :class="{ selected: backgroundEquipmentId === kit.id }"
                                        :aria-pressed="backgroundEquipmentId === kit.id"
                                        :disabled="disabled"
                                        @click="selectBackgroundKit(kit.id)"
                                    >
                                        <span class="selection-card-top"
                                            ><span class="selection-sigil" aria-hidden="true"
                                                >✧</span
                                            ><span
                                                v-if="backgroundEquipmentId === kit.id"
                                                class="selection-check"
                                                aria-label="Выбрано"
                                                >✓</span
                                            ></span
                                        ><strong>{{ kit.label }}</strong
                                        ><span class="equipment-card-items">{{
                                            kit.items
                                                .map(item => `${item.name} × ${item.quantity}`)
                                                .join(' · ')
                                        }}</span
                                        ><span class="selection-description"
                                            >{{ kit.items.length }} позиций</span
                                        >
                                    </button>
                                </div>
                            </div>
                        </template>

                        <template v-else-if="currentStep === 4">
                            <div
                                v-if="availableSubraces.length"
                                class="selection-grid subrace-selection-grid"
                                role="group"
                                aria-label="Выберите подрасу"
                            >
                                <button
                                    v-for="subrace in availableSubraces"
                                    :key="subrace.id"
                                    type="button"
                                    class="selection-card selection-card-wide"
                                    :class="{ selected: subraceId === subrace.id }"
                                    :aria-pressed="subraceId === subrace.id"
                                    :disabled="disabled"
                                    @click="selectSubrace(subrace.id)"
                                >
                                    <span class="selection-card-top"
                                        ><span class="selection-sigil" aria-hidden="true">✧</span
                                        ><span
                                            v-if="subraceId === subrace.id"
                                            class="selection-check"
                                            aria-label="Выбрано"
                                            >✓</span
                                        ></span
                                    ><strong>{{ subrace.label }}</strong
                                    ><span class="selection-description">{{
                                        subrace.description
                                    }}</span
                                    ><span class="selection-bonuses"
                                        ><span
                                            v-for="bonus in subraceBonusLines(subrace.id)"
                                            :key="bonus"
                                            >{{ bonus }}</span
                                        ></span
                                    ><span class="selection-traits">{{
                                        subrace.traits.join(' · ')
                                    }}</span
                                    ><span v-if="subrace.languages?.length" class="selection-origin"
                                        >Языки: {{ subrace.languages.join(', ') }}</span
                                    >
                                </button>
                            </div>
                            <div v-else class="creation-callout">
                                <span aria-hidden="true">✧</span>
                                <p v-if="ruleset === '2024'">
                                    В D&amp;D 2024 дополнительные варианты вида выбираются на
                                    предыдущем шаге. Можно перейти дальше.
                                </p>
                                <p v-else>
                                    Для расы «{{ selectedRace.label }}» отдельные подрасы в текущем
                                    наборе правил не заданы. Можно перейти дальше.
                                </p>
                            </div>
                        </template>

                        <template v-else-if="currentStep === 5">
                            <div
                                class="selection-grid class-selection-grid"
                                role="group"
                                aria-label="Выберите класс"
                            >
                                <button
                                    v-for="item in classOptions"
                                    :key="item.id"
                                    type="button"
                                    class="selection-card"
                                    :class="{ selected: classId === item.id }"
                                    :aria-pressed="classId === item.id"
                                    :disabled="disabled"
                                    @click="updateClass(item.id)"
                                >
                                    <span class="selection-card-top"
                                        ><span class="class-icon" aria-hidden="true"
                                            ><img
                                                v-if="classIconFor(item.id, gender)"
                                                :src="classIconFor(item.id, gender)"
                                                class="class-card-image"
                                                :alt="`Иллюстрация класса «${item.label}» (${gender === 'male' ? 'мужской' : 'женский'} вариант)`"
                                                loading="lazy"
                                            /><span v-else class="class-icon-fallback">{{
                                                item.hitDie
                                            }}</span></span
                                        ><span
                                            v-if="classId === item.id"
                                            class="selection-check"
                                            aria-label="Выбрано"
                                            >✓</span
                                        ></span
                                    ><strong>{{ item.label }}</strong
                                    ><span class="selection-description">{{
                                        item.description
                                            ? `${item.description} Основная характеристика: ${ABILITY_FIELDS.find(field => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}`
                                            : `Основная характеристика: ${ABILITY_FIELDS.find(field => field.key === item.primaryAbility)?.label} · Хиты ${item.hitDie}`
                                    }}</span
                                    ><span class="selection-traits"
                                        >Особенности: {{ item.features.join(' · ') }}</span
                                    ><span class="selection-origin"
                                        >Спасброски:
                                        {{
                                            item.savingThrowKeys
                                                .map(
                                                    key =>
                                                        ABILITY_FIELDS.find(
                                                            field => field.key === key,
                                                        )?.label ?? key,
                                                )
                                                .join(' · ')
                                        }}</span
                                    ><span class="selection-origin"
                                        >Навыки:
                                        {{
                                            item.skillOptions
                                                .map(id => skillLabels[id] ?? id)
                                                .join(' · ')
                                        }}
                                        · выбрать {{ item.skillChoiceCount }}</span
                                    ><span
                                        v-if="item.weaponProficiencies?.length"
                                        class="selection-origin"
                                        >Оружие: {{ item.weaponProficiencies.join(' · ') }}</span
                                    ><span
                                        v-if="item.armorProficiencies?.length"
                                        class="selection-origin"
                                        >Броня: {{ item.armorProficiencies.join(' · ') }}</span
                                    ><span
                                        v-if="item.startingEquipment?.length"
                                        class="selection-origin"
                                        >Снаряжение:
                                        {{
                                            item.startingEquipment.map(kit => kit.label).join(' · ')
                                        }}</span
                                    ><span class="selection-origin">{{
                                        item.spellcastingAbility
                                            ? `Магия: ${ABILITY_FIELDS.find(field => field.key === item.spellcastingAbility)?.label} · ${spellProgressionLabel(item.spellProgressionType)}`
                                            : 'Без заклинаний на этом шаге'
                                    }}</span>
                                </button>
                            </div>
                        </template>

                        <template v-else-if="currentStep === 6">
                            <div class="creation-source-hint">
                                <span class="source-dot race-dot"></span
                                ><span
                                    >Выберите исходные значения характеристик. Навыки выбираются
                                    напрямую на следующем шаге.</span
                                >
                            </div>
                            <div class="creator-abilities creation-ability-grid">
                                <article
                                    v-for="field in ABILITY_FIELDS"
                                    :key="field.key"
                                    class="creation-ability-card"
                                    :class="{
                                        'has-racial-bonus':
                                            finalAbility(field.key) !== baseAbilities[field.key],
                                        'creation-ability-card-modern': ruleset === '2024',
                                    }"
                                >
                                    <div class="creation-ability-input-row">
                                        <NFormItem :label="field.label"
                                            ><NInputNumber
                                                min="1"
                                                max="30"
                                                step="1"
                                                :disabled="disabled"
                                                :value="baseAbilities[field.key]"
                                                @update:value="
                                                    updateAbility(field.key, $event)
                                                " /></NFormItem
                                        ><strong
                                            v-if="ruleset === '2024'"
                                            class="ability-modifier-inline"
                                            >{{
                                                signedModifier(
                                                    abilityModifier(finalAbility(field.key)),
                                                )
                                            }}</strong
                                        >
                                    </div>
                                    <div v-if="ruleset !== '2024'" class="ability-result">
                                        <span
                                            >Итог <b>{{ finalAbility(field.key) }}</b></span
                                        ><strong>{{
                                            signedModifier(abilityModifier(finalAbility(field.key)))
                                        }}</strong>
                                    </div>
                                    <span
                                        v-if="
                                            ruleset !== '2024' &&
                                            finalAbility(field.key) !== baseAbilities[field.key]
                                        "
                                        class="ability-source"
                                        >Раса / подраса
                                        {{
                                            signedModifier(
                                                finalAbility(field.key) - baseAbilities[field.key],
                                            )
                                        }}</span
                                    ><span v-else-if="ruleset !== '2024'" class="ability-source"
                                        >Без бонуса происхождения</span
                                    >
                                </article>
                            </div>
                        </template>

                        <template v-else-if="currentStep === 7">
                            <div class="skill-step-summary">
                                <span :class="{ 'selection-complete': classSkillsRemaining === 0 }"
                                    >Выбор навыков:
                                    <b>{{ selectedCount }} / {{ selectedClass.skillChoiceCount }}</b
                                    ><small>{{
                                        classSkillsRemaining
                                            ? `Осталось выбрать: ${classSkillsRemaining}`
                                            : 'Выбор завершён'
                                    }}</small></span
                                ><span
                                    v-if="selectedRace.skillChoices?.count"
                                    :class="{ 'selection-complete': raceSkillsRemaining === 0 }"
                                    >Навыки вида:
                                    <b
                                        >{{ raceSelectedCount }} /
                                        {{ selectedRace.skillChoices.count }}</b
                                    ><small>{{
                                        raceSkillsRemaining
                                            ? `Осталось выбрать: ${raceSkillsRemaining}`
                                            : 'Выбор завершён'
                                    }}</small></span
                                >
                            </div>
                            <div class="creation-skills-list">
                                <button
                                    v-for="skill in selectableSkills"
                                    :key="skill.id"
                                    type="button"
                                    class="creation-skill-row creation-skill-choice"
                                    :class="{ selected: isSkillChoiceSelected(skill.id) }"
                                    :aria-pressed="isSkillChoiceSelected(skill.id)"
                                    :disabled="
                                        disabled ||
                                        (!isSkillChoiceSelected(skill.id) &&
                                            !canSelectSkill(skill.id))
                                    "
                                    @click="toggleSelectableSkill(skill.id)"
                                >
                                    <span class="creation-skill-name"
                                        ><strong>{{ skill.name }}</strong
                                        ><span
                                            >{{
                                                ABILITY_FIELDS.find(
                                                    field => field.key === skill.ability,
                                                )?.label ?? 'Характеристика не задана'
                                            }}
                                            · итог
                                            {{
                                                currentOwnedSkills.find(
                                                    entry => entry.id === skill.id,
                                                )?.bonus ??
                                                signedModifier(
                                                    abilityModifier(
                                                        skill.ability
                                                            ? finalAbility(skill.ability)
                                                            : 10,
                                                    ),
                                                )
                                            }}</span
                                        ></span
                                    ><span class="creation-skill-choice-source">{{
                                        selectableSkillSource(skill.id)
                                    }}</span
                                    ><span
                                        class="creation-skill-selection-check"
                                        :class="{ visible: isSkillChoiceSelected(skill.id) }"
                                        :aria-label="
                                            isSkillChoiceSelected(skill.id) ? 'Выбрано' : undefined
                                        "
                                        >{{ isSkillChoiceSelected(skill.id) ? '✓' : '' }}</span
                                    >
                                </button>
                            </div>
                            <p class="creation-source-explainer">
                                Выберите ровно указанное количество навыков класса и вида. После
                                достижения лимита остальные варианты блокируются. Владения
                                складываются по источникам: один навык может одновременно
                                происходить от вида, класса и ручной настройки.
                            </p>
                        </template>

                        <template v-else-if="currentStep === 8">
                            <div class="equipment-choice-group">
                                <div class="equipment-group-heading">
                                    <h3>Набор класса · {{ selectedClass.label }}</h3>
                                    <p class="c-section-note">
                                        Выберите один вариант — его предметы попадут в инвентарь при
                                        создании.
                                    </p>
                                </div>
                                <div class="selection-grid equipment-selection-grid">
                                    <button
                                        v-for="kit in classEquipmentOptions"
                                        :key="kit.id"
                                        type="button"
                                        class="selection-card equipment-card"
                                        :class="{ selected: classEquipmentId === kit.id }"
                                        :aria-pressed="classEquipmentId === kit.id"
                                        :disabled="disabled"
                                        @click="selectClassKit(kit.id)"
                                    >
                                        <span class="selection-card-top"
                                            ><span class="selection-sigil" aria-hidden="true"
                                                >⚔</span
                                            ><span
                                                v-if="classEquipmentId === kit.id"
                                                class="selection-check"
                                                aria-label="Выбрано"
                                                >✓</span
                                            ></span
                                        ><strong>{{ kit.label }}</strong
                                        ><span class="equipment-card-items">{{
                                            kit.items
                                                .map(item => `${item.name} × ${item.quantity}`)
                                                .join(' · ')
                                        }}</span
                                        ><span class="selection-description"
                                            >{{ kit.items.length }} позиций снаряжения</span
                                        >
                                    </button>
                                </div>
                            </div>
                            <div class="equipment-preview-strip">
                                <strong>Будет добавлено в инвентарь</strong
                                ><span
                                    v-for="(item, index) in previewEquipment"
                                    :key="`${item.source}-${item.name}-${index}`"
                                    >{{ item.name }} × {{ item.quantity }}
                                    <small>{{ item.source }}</small></span
                                >
                            </div>
                        </template>

                        <template v-else>
                            <div v-if="!completed" class="creation-review">
                                <div class="review-medallion" aria-hidden="true">✦</div>
                                <p class="c-eyebrow">Последняя проверка</p>
                                <h3>{{ name.trim() || 'Безымянный герой' }}</h3>
                                <p class="review-identity">
                                    {{ selectedRace.label }} · {{ selectedBackground.label
                                    }}<span v-if="selectedSubrace">
                                        · {{ selectedSubrace.label }}</span
                                    >
                                    ·
                                    {{ selectedClass.label }}
                                </p>
                                <div class="review-abilities">
                                    <span v-for="field in ABILITY_FIELDS" :key="field.key"
                                        ><small>{{ field.label.slice(0, 3) }}</small
                                        ><b>{{ finalAbility(field.key) }}</b
                                        ><em>{{
                                            signedModifier(abilityModifier(finalAbility(field.key)))
                                        }}</em></span
                                    >
                                </div>
                                <div class="review-bottom">
                                    <div>
                                        <strong>Особенности</strong>
                                        <p>{{ previewFeatures.slice(0, 5).join(' · ') }}</p>
                                    </div>
                                    <div>
                                        <strong>Снаряжение</strong>
                                        <p>
                                            {{
                                                previewEquipment
                                                    .map(item => `${item.name} × ${item.quantity}`)
                                                    .join(' · ')
                                            }}
                                        </p>
                                    </div>
                                </div>
                                <div class="creation-callout">
                                    <span aria-hidden="true">✧</span>
                                    <p>
                                        После создания изменения останутся черновиком. Используйте
                                        общую кнопку «Сохранить» на листе, чтобы записать персонажа.
                                    </p>
                                </div>
                            </div>
                            <div v-else class="creation-finished">
                                <div class="finished-seal" aria-hidden="true">✦</div>
                                <p class="c-eyebrow">Путь начинается</p>
                                <h3>Персонаж готов</h3>
                                <p>
                                    {{ name }} — {{ selectedRace.label }} ·
                                    {{ selectedBackground.label
                                    }}<span v-if="selectedSubrace">
                                        · {{ selectedSubrace.label }}</span
                                    >, {{ selectedClass.label }}.
                                </p>
                                <div class="finished-actions">
                                    <NButton type="primary" @click="emit('back-to-sheet')"
                                        >Открыть лист персонажа</NButton
                                    ><NButton @click="completed = false">Изменить</NButton>
                                </div>
                            </div>
                        </template>

                        <footer v-if="!completed" class="creation-navigation">
                            <NButton :disabled="disabled || currentStep === 1" @click="previousStep"
                                >Назад</NButton
                            ><span class="navigation-step-caption"
                                >{{ currentStep }} / {{ stepNames.length }}</span
                            ><NButton
                                v-if="currentStep < stepNames.length"
                                type="default"
                                :disabled="disabled || !canContinue"
                                @click="nextStep"
                                >Далее</NButton
                            ><NButton
                                v-else
                                type="primary"
                                :disabled="disabled || !canContinue"
                                @click="applyCreation"
                                >Создать персонажа</NButton
                            >
                        </footer>
                    </section>
                </Transition>
            </div>

            <aside
                v-if="!props.hidePreview"
                class="character-preview"
                :class="{ compact: currentStep !== 9 }"
                aria-label="Предпросмотр персонажа"
                aria-live="polite"
            >
                <div class="preview-bookmark">Лист героя · предпросмотр</div>
                <div class="preview-portrait">
                    <span v-if="selectedSpeciesIcon" class="portrait-frame species-preview-frame"
                        ><span
                            data-asset-fallback
                            class="species-icon-fallback"
                            :hidden="Boolean(selectedSpeciesIcon)"
                            >{{ selectedRace.label.slice(0, 1) }}</span
                        ><img
                            :src="selectedSpeciesIcon"
                            :alt="`Иконка вида «${selectedRace.label}»`"
                            @error="hideBrokenAsset" /></span
                    ><span v-else class="portrait-frame"
                        ><span>{{ initials }}</span></span
                    ><span class="portrait-caption">{{
                        selectedSpeciesIcon ? 'Иконка вида' : 'Портрет появится позже'
                    }}</span>
                </div>
                <div class="preview-identity">
                    <p class="c-eyebrow">Новый искатель приключений</p>
                    <h2>{{ name.trim() || 'Имя героя' }}</h2>
                    <p>
                        {{ selectedRace.label }} · {{ selectedBackground.label
                        }}<span v-if="selectedSubrace"> · {{ selectedSubrace.label }}</span>
                    </p>
                    <div class="preview-class-row">
                        <span>{{ selectedClass.label }}</span
                        ><span>Уровень {{ props.character.level }}</span>
                    </div>
                    <div v-if="selectedBackgroundIcon" class="preview-background-row">
                        <span class="background-preview-icon"
                            ><span data-asset-fallback :hidden="Boolean(selectedBackgroundIcon)">{{
                                selectedBackground.label.slice(0, 1)
                            }}</span
                            ><img
                                :src="selectedBackgroundIcon"
                                :alt="`Иконка предыстории «${selectedBackground.label}»`"
                                @error="hideBrokenAsset" /></span
                        ><span>Предыстория: {{ selectedBackground.label }}</span>
                    </div>
                </div>
                <div class="preview-divider"><span>Характеристики</span></div>
                <div class="preview-ability-grid">
                    <div v-for="field in ABILITY_FIELDS" :key="field.key">
                        <small>{{ field.label }}</small
                        ><b>{{ finalAbility(field.key) }}</b
                        ><span>{{ signedModifier(abilityModifier(finalAbility(field.key))) }}</span>
                    </div>
                </div>
                <div class="preview-section">
                    <h3>Владения</h3>
                    <div v-if="currentOwnedSkills.length" class="preview-badges">
                        <span
                            v-for="skill in currentOwnedSkills.slice(0, 8)"
                            :key="skill.id"
                            class="preview-skill"
                            ><b>{{ skillLabels[skill.id] ?? skill.name }}</b
                            ><small>{{ skill.sources.map(sourceLabel).join(' + ') }}</small></span
                        >
                    </div>
                    <p v-else class="preview-muted">Выберите навыки, чтобы увидеть владения.</p>
                </div>
                <div class="preview-section">
                    <h3>Особенности</h3>
                    <ul class="preview-feature-list">
                        <li
                            v-for="feature in previewFeatures.slice(0, currentStep === 9 ? 8 : 3)"
                            :key="feature"
                        >
                            {{ feature }}
                        </li>
                    </ul>
                </div>
                <div class="preview-section">
                    <h3>Стартовое снаряжение</h3>
                    <ul v-if="previewEquipment.length" class="preview-equipment-list">
                        <li
                            v-for="(item, index) in previewEquipment.slice(
                                0,
                                currentStep === 9 ? 8 : 4,
                            )"
                            :key="`${item.source}-${item.name}-${index}`"
                        >
                            {{ item.name }} <span>× {{ item.quantity }}</span>
                        </li>
                    </ul>
                    <p v-else class="preview-muted">Пока не выбрано</p>
                </div>
                <p class="preview-draft-note">Изменения пока не сохранены</p>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.creator-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
}
.creator-abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-top: 16px;
}
.origin-ability-choice {
    display: grid;
    gap: 10px;
    margin-top: 16px;
    padding: 13px 14px;
    border: 1px solid #d6bd91;
    border-radius: 11px;
    background: rgba(255, 248, 231, 0.72);
}
.origin-ability-choice > div:first-child {
    display: grid;
    gap: 3px;
}
.origin-ability-choice small {
    color: var(--sheet-muted);
    font-size: 0.78rem;
}
.origin-ability-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.origin-ability-option {
    min-height: 36px;
    padding: 7px 11px;
    border: 1px solid var(--sheet-line);
    border-radius: 8px;
    background: rgba(255, 252, 244, 0.92);
    color: var(--sheet-ink);
    cursor: pointer;
    font: inherit;
    font-size: 0.78rem;
    font-weight: 700;
    transition:
        background-color 0.18s ease,
        border-color 0.18s ease,
        transform 0.18s ease;
}
.origin-ability-option:hover:not(:disabled) {
    border-color: var(--sheet-gold);
    transform: translateY(-1px);
}
.origin-ability-option.selected {
    border-color: var(--sheet-burgundy);
    background: #f2dfbd;
    box-shadow: 0 0 0 2px rgba(122, 62, 67, 0.12);
}
.origin-ability-option:disabled {
    cursor: default;
    opacity: 0.62;
}
.origin-ability-focus {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--sheet-muted);
    font-size: 0.78rem;
    font-weight: 700;
}
.creation-navigation {
    align-items: center;
}
@media (max-width: 800px) {
    .creator-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .creator-abilities {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
@media (max-width: 560px) {
    .creator-grid,
    .creator-abilities {
        grid-template-columns: minmax(0, 1fr);
    }
}
.creation-tab {
    display: block;
}
.creation-hero {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto;
    align-items: center;
    gap: 18px;
    margin-top: 22px;
    overflow: hidden;
    position: relative;
    background:
        radial-gradient(ellipse at 10% 0%, rgba(205, 165, 98, 0.2), transparent 54%),
        linear-gradient(135deg, rgba(255, 250, 237, 0.98), rgba(240, 221, 187, 0.88));
    border-color: #cdb58e;
}
.creation-hero::after {
    content: '';
    position: absolute;
    right: -22px;
    top: -74px;
    width: 210px;
    height: 210px;
    border: 1px solid rgba(145, 104, 53, 0.2);
    border-radius: 50%;
    box-shadow:
        0 0 0 12px rgba(145, 104, 53, 0.035),
        0 0 0 26px rgba(145, 104, 53, 0.025);
    pointer-events: none;
}
.creation-hero-mark {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    border: 1px solid #b99967;
    border-radius: 50%;
    box-shadow:
        inset 0 0 0 5px rgba(184, 147, 87, 0.12),
        0 4px 12px rgba(80, 52, 25, 0.09);
    color: #8b622c;
    font-size: 2rem;
}
.creation-hero-copy {
    min-width: 0;
}
.creation-hero-copy h1 {
    margin: 0;
    color: #442e1d;
    font-family: var(--font-serif);
    font-size: clamp(1.45rem, 2.2vw, 2rem);
    line-height: 1.15;
}
.creation-hero-copy .c-section-note {
    max-width: 610px;
    font-size: 0.9rem;
}
.creation-progress-copy {
    display: grid;
    justify-items: end;
    gap: 3px;
    min-width: 106px;
    color: #67451f;
}
.creation-progress-copy strong {
    font-size: 0.82rem;
}
.creation-progress-copy span {
    color: #977344;
    font-size: 0.78rem;
}
.creation-progress-track {
    bottom: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: rgba(132, 95, 47, 0.13);
}
.creation-progress-track span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #8f6635, #c29248, #7a3d3e);
    transition: width 0.35s ease;
}
.creation-step-nav {
    margin: 12px 0 18px;
    padding: 12px 14px;
    border: 1px solid rgba(169, 137, 93, 0.48);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(255, 250, 239, 0.96), rgba(246, 234, 211, 0.91));
    box-shadow:
        inset 0 1px rgba(255, 255, 255, 0.8),
        0 5px 15px rgba(78, 54, 30, 0.05);
    overflow-x: auto;
}
.creation-step-nav ol {
    display: grid;
    grid-template-columns: repeat(9, minmax(88px, 1fr));
    gap: 4px;
    min-width: 800px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.creation-step-nav li {
    min-width: 0;
    position: relative;
}
.creation-step-nav li:not(:last-child)::after {
    content: '';
    position: absolute;
    z-index: 0;
    top: 16px;
    right: -4px;
    width: 9px;
    height: 1px;
    background: #d1bd9c;
}
.creation-step-nav button {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
    width: 100%;
    min-height: 62px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    color: #816d55;
    cursor: pointer;
}
.creation-step-nav button:disabled {
    color: #b9ad9a;
    cursor: not-allowed;
}
.creation-step-nav .step-number {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    border: 1px solid #c9b48d;
    border-radius: 50%;
    background: #fff9ed;
    color: #72532e;
    font-size: 0.78rem;
    font-weight: 800;
    transition: all 0.2s ease;
}
.creation-step-nav .step-label {
    display: block;
    max-width: 100%;
    min-height: 2.3em;
    color: inherit;
    font-size: 0.69rem;
    font-weight: 700;
    line-height: 1.15;
    overflow-wrap: anywhere;
    text-align: center;
    white-space: normal;
}
.creation-step-nav li.active .step-number {
    width: 35px;
    height: 35px;
    margin-top: -2px;
    border-color: #794046;
    background: #793f45;
    box-shadow: 0 0 0 4px rgba(121, 63, 69, 0.12);
    color: #fff8e9;
}
.creation-step-nav li.active .step-label {
    color: #63383b;
}
.creation-step-nav li.done .step-number {
    border-color: #718355;
    background: #718355;
    color: #fffdf5;
}
.creation-step-nav li.done .step-label {
    color: #5f6e45;
}
.creation-step-nav li.locked .step-number {
    border-style: dashed;
    background: #f3ead9;
}
.creation-workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 322px);
    align-items: start;
    gap: 18px;
}
.creation-main-column {
    min-width: 0;
}
.creation-step-panel {
    min-height: 540px;
}
.creation-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin: 0 0 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e6d6ba;
}
.creation-panel-heading h2 {
    margin: 0;
    font-family: var(--font-serif);
}
.creation-panel-heading .c-eyebrow {
    margin-bottom: 4px;
}
.creation-rune {
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border: 1px solid #d0b888;
    border-radius: 50%;
    color: #a17a42;
    font-size: 1.45rem;
    background: #fbf2df;
}
.creation-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 24px;
    padding-top: 15px;
    border-top: 1px solid #eadcc3;
}
.navigation-step-caption {
    color: #88745c;
    font-size: 0.78rem;
    font-weight: 700;
}
.creation-error {
    margin: 0 0 16px;
    padding: 11px 13px;
    border: 1px solid #d7aaa1;
    border-left: 4px solid #9c4842;
    border-radius: 8px;
    background: #fff0eb;
    color: #74352e;
    font-size: 0.86rem;
    line-height: 1.4;
}
.creation-callout {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 18px;
    padding: 12px 14px;
    border: 1px solid #e3cfaa;
    border-radius: 10px;
    background: rgba(250, 239, 214, 0.72);
    color: #715735;
}
.creation-callout > span {
    color: #9b6a2f;
    font-size: 1.1rem;
}
.creation-callout p {
    margin: 0;
    font-size: 0.83rem;
    line-height: 1.45;
}
.creation-identity-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.creation-identity-fields > :first-child {
    grid-column: 1 / -1;
}
.selection-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
}
.selection-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    min-height: 190px;
    padding: 14px 15px;
    border: 1px solid #ddceb1;
    border-radius: 12px;
    background: linear-gradient(145deg, rgba(255, 252, 244, 0.94), rgba(247, 236, 215, 0.8));
    box-shadow:
        0 3px 8px rgba(76, 52, 27, 0.035),
        inset 0 1px rgba(255, 255, 255, 0.8);
    color: #493522;
    text-align: left;
    cursor: pointer;
    transition:
        border-color 0.18s ease,
        background 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
    animation: creation-card-in 0.3s both;
}
.selection-card:nth-child(2) {
    animation-delay: 0.025s;
}
.selection-card:nth-child(3) {
    animation-delay: 0.05s;
}
.selection-card:nth-child(4) {
    animation-delay: 0.075s;
}
.selection-card:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: #b18a53;
    box-shadow:
        0 8px 18px rgba(78, 53, 26, 0.1),
        inset 0 1px rgba(255, 255, 255, 0.9);
}
.selection-card:active:not(:disabled) {
    transform: translateY(0) scale(0.995);
}
.selection-card.selected {
    border: 2px solid #8b5b39;
    padding: 13px 14px;
    background: linear-gradient(145deg, #fff9e9, #f2dfba);
    box-shadow:
        0 0 0 3px rgba(155, 106, 47, 0.13),
        0 7px 17px rgba(77, 49, 22, 0.09);
}
.selection-card:disabled {
    opacity: 0.54;
    cursor: not-allowed;
    filter: saturate(0.6);
}
.selection-card:focus-visible,
.creation-step-nav button:focus-visible {
    outline: 3px solid rgba(127, 60, 67, 0.44);
    outline-offset: 2px;
}
.selection-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 9px;
}
.species-icon {
    display: grid;
    place-items: center;
    position: relative;
    width: 128px;
    height: 128px;
    overflow: hidden;
    border: 1px solid #d5c19b;
    border-radius: 50%;
    background: #f8efd9;
    color: #75552e;
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 800;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
}
.species-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.selection-card:hover:not(:disabled) .species-icon {
    border-color: #b18a53;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 3px 8px rgba(78, 53, 26, 0.12);
    transform: scale(1.02);
}
.selection-card.selected .species-icon {
    border-color: var(--sheet-burgundy);
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 0 0 3px rgba(155, 106, 47, 0.13);
}
.background-icon {
    display: grid;
    place-items: center;
    position: relative;
    width: 128px;
    height: 128px;
    overflow: hidden;
    border: 1px solid #d5c19b;
    border-radius: 50%;
    background: #f8efd9;
    color: #75552e;
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 800;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
}
.background-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.selection-card:hover:not(:disabled) .background-icon {
    border-color: #b18a53;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 3px 8px rgba(78, 53, 26, 0.12);
    transform: scale(1.02);
}
.selection-card.selected .background-icon {
    border-color: var(--sheet-burgundy);
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 0 0 3px rgba(155, 106, 47, 0.13);
}
.class-icon {
    display: grid;
    place-items: center;
    width: 128px;
    height: 128px;
    overflow: hidden;
    border: 1px solid #d5c19b;
    border-radius: 50%;
    background: #f8efd9;
    color: #75552e;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
    transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        transform 0.18s ease;
}
.selection-card:hover:not(:disabled) .class-icon {
    border-color: #b18a53;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 3px 8px rgba(78, 53, 26, 0.12);
    transform: scale(1.02);
}
.selection-card.selected .class-icon {
    border-color: #8b5b39;
    box-shadow:
        inset 0 0 0 3px rgba(255, 255, 255, 0.55),
        0 0 0 3px rgba(155, 106, 47, 0.13);
}
.class-card-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}
.class-icon-fallback {
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 800;
}
.selection-sigil {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid #d5c19b;
    border-radius: 10px 10px 10px 2px;
    background: #f8efd9;
    color: #75552e;
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 800;
}
.selection-check {
    display: grid;
    place-items: center;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background: #718355;
    color: white;
    font-size: 0.8rem;
    font-weight: 900;
}
.selection-card > strong {
    color: #452f20;
    font-family: var(--font-serif);
    font-size: 1rem;
}
.selection-description,
.selection-traits,
.selection-origin {
    display: block;
    margin-top: 6px;
    color: #76634c;
    font-size: 0.76rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
}
.selection-traits {
    color: #5d4935;
}
.selection-origin {
    margin-top: auto;
    padding-top: 9px;
    color: #78464a;
    font-weight: 700;
}
.selection-bonuses {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 9px;
}
.selection-bonuses > span {
    padding: 4px 7px;
    border: 1px solid #dbc49b;
    border-radius: 999px;
    background: #f7ead0;
    color: #714c25;
    font-size: 0.7rem;
    font-weight: 800;
}
.creation-race-bonus-note {
    margin: 10px 0 13px;
}
.selection-card-wide {
    min-height: 175px;
}
.subrace-selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.species-choice-panel {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--sheet-line, #d5ba8a);
    border-radius: 0.75rem;
    background: rgba(255, 250, 238, 0.72);
}
.species-choice-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(13rem, 18rem);
    gap: 1rem;
    align-items: center;
    padding: 0.75rem 0;
    border-top: 1px solid rgba(151, 111, 57, 0.24);
}
.species-choice-row:first-of-type {
    border-top: 0;
}
@media (max-width: 640px) {
    .species-choice-row {
        grid-template-columns: minmax(0, 1fr);
    }
}
.background-selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.creation-ability-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 11px;
}
.creation-ability-card {
    display: grid;
    gap: 9px;
    min-width: 0;
    padding: 13px;
    border: 1px solid #dfd0b5;
    border-radius: 12px;
    background: rgba(255, 249, 236, 0.78);
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}
.creation-ability-card.has-racial-bonus {
    border-color: #bc975d;
    box-shadow: inset 0 0 0 1px rgba(188, 151, 93, 0.2);
}
.creation-ability-input-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    min-width: 0;
}
.creation-ability-input-row > :deep(.flex-col) {
    flex: 1 1 auto;
    min-width: 0;
}
.ability-modifier-inline {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    min-width: 38px;
    min-height: 34px;
    border: 1px solid #d6c39e;
    border-radius: 9px;
    background: #fff7e6;
    color: #714d28;
    font-size: 1rem;
}
.creation-ability-card :deep(.n-input) {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 800;
}
.ability-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #796448;
    font-size: 0.75rem;
}
.ability-result b {
    margin-left: 5px;
    color: #4c3723;
    font-size: 1rem;
}
.ability-result strong {
    display: grid;
    place-items: center;
    min-width: 38px;
    min-height: 34px;
    border: 1px solid #d6c39e;
    border-radius: 9px;
    background: #fff7e6;
    color: #714d28;
    font-size: 1rem;
}
.ability-source {
    color: #90754f;
    font-size: 0.68rem;
    line-height: 1.3;
}
.creation-source-hint {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-bottom: 13px;
    color: #78664f;
    font-size: 0.78rem;
    line-height: 1.4;
}
.source-dot {
    display: inline-block;
    flex: 0 0 9px;
    width: 9px;
    height: 9px;
    margin-top: 4px;
    border-radius: 50%;
}
.race-dot {
    background: #a67536;
}
.skill-step-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 12px;
}
.skill-step-summary span {
    padding: 6px 9px;
    border: 1px solid #ddceb1;
    border-radius: 999px;
    background: #fbf4e5;
    color: #796449;
    font-size: 0.72rem;
}
.skill-step-summary small {
    display: inline-block;
    margin-left: 5px;
}
.skill-step-summary b {
    color: #573d24;
}
.creation-skills-list {
    display: grid;
    gap: 6px;
}
.creation-skill-row {
    display: grid;
    grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 0.9fr) minmax(110px, 0.8fr);
    align-items: center;
    gap: 9px;
    padding: 9px 10px;
    border: 1px solid transparent;
    border-bottom-color: #eadcc3;
    border-radius: 8px;
    transition:
        background 0.16s ease,
        border-color 0.16s ease;
}
.creation-skill-name {
    display: grid;
    gap: 3px;
    min-width: 0;
}
.creation-skill-name strong {
    color: #493522;
    font-size: 0.82rem;
}
.creation-skill-name > span {
    color: #88755c;
    font-size: 0.67rem;
}
.creation-source-explainer {
    margin: 12px 0 0;
    color: #88745d;
    font-size: 0.75rem;
    line-height: 1.45;
}
.equipment-choice-group + .equipment-choice-group {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid #e5d5b8;
}
.equipment-group-heading h3 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1rem;
}
.equipment-group-heading .c-section-note {
    margin-bottom: 10px;
}
.equipment-selection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.equipment-card {
    min-height: 150px;
}
.equipment-card-items {
    display: block;
    margin-top: 8px;
    color: #584532;
    font-size: 0.76rem;
    line-height: 1.45;
}
.equipment-preview-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-top: 18px;
    padding: 12px;
    border: 1px dashed #c7ac7d;
    border-radius: 10px;
    background: rgba(251, 241, 218, 0.62);
}
.equipment-preview-strip > strong {
    width: 100%;
    color: #72512c;
    font-size: 0.76rem;
}
.equipment-preview-strip > span {
    padding: 5px 8px;
    border: 1px solid #e3d0ab;
    border-radius: 7px;
    background: #fff9eb;
    color: #57432c;
    font-size: 0.72rem;
}
.equipment-preview-strip small {
    margin-left: 4px;
    color: #977a50;
}
.character-preview {
    position: sticky;
    top: 16px;
    min-width: 0;
    padding: 15px;
    border: 1px solid #bda477;
    border-radius: 14px;
    background: linear-gradient(160deg, rgba(255, 251, 239, 0.98), rgba(238, 221, 190, 0.94));
    box-shadow:
        0 10px 24px rgba(75, 51, 27, 0.11),
        inset 0 0 0 4px rgba(184, 147, 87, 0.09);
    overflow: hidden;
}
.character-preview::before {
    content: '';
    position: absolute;
    inset: 7px;
    border: 1px solid rgba(147, 110, 61, 0.25);
    border-radius: 9px;
    pointer-events: none;
}
.character-preview > * {
    position: relative;
    z-index: 1;
}
.preview-bookmark {
    margin: -15px -15px 12px;
    padding: 8px 12px;
    background: #75464a;
    color: #fff5e4;
    text-align: center;
    font-family: var(--font-serif);
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.preview-portrait {
    display: flex;
    align-items: center;
    gap: 10px;
}
.portrait-frame {
    display: grid;
    place-items: center;
    flex: 0 0 60px;
    width: 60px;
    height: 60px;
    border: 2px solid #a5824d;
    border-radius: 50%;
    background: radial-gradient(circle, #f9edcf, #e2c995);
    box-shadow: inset 0 0 0 4px rgba(255, 250, 236, 0.65);
    color: #76522b;
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 800;
}
.species-preview-frame {
    position: relative;
    flex-basis: 128px;
    width: 128px;
    height: 128px;
}
.species-preview-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.portrait-caption {
    color: #8a755b;
    font-size: 0.68rem;
}
.preview-identity {
    margin-top: 13px;
    text-align: center;
}
.preview-identity .c-eyebrow {
    margin-bottom: 4px;
    font-size: 0.56rem;
}
.preview-identity h2 {
    margin: 0;
    color: #49311f;
    font-family: var(--font-serif);
    font-size: 1.25rem;
    overflow-wrap: anywhere;
}
.preview-identity p:not(.c-eyebrow) {
    margin: 4px 0 8px;
    color: #785837;
    font-size: 0.78rem;
}
.preview-class-row {
    display: flex;
    justify-content: center;
    gap: 7px;
    color: #654044;
    font-family: var(--font-serif);
    font-size: 0.78rem;
    font-weight: 800;
}
.preview-class-row span + span::before {
    content: '·';
    margin-right: 7px;
    color: #b49667;
}
.preview-background-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    color: #785837;
    font-size: 0.7rem;
    font-weight: 700;
}
.background-preview-icon {
    display: grid;
    place-items: center;
    position: relative;
    width: 34px;
    height: 34px;
    overflow: hidden;
    border: 1px solid #c4a474;
    border-radius: 50%;
    background: #f5e5c4;
    color: #704b25;
    font-family: var(--font-serif);
    font-size: 0.75rem;
    font-weight: 800;
}
.background-preview-icon img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center 38%;
    transform: translateY(-4%);
}
.preview-identity > small {
    display: block;
    margin-top: 5px;
    color: #8b755a;
    font-size: 0.67rem;
}
.preview-divider {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 15px 0 9px;
    color: #82633c;
    font-size: 0.62rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}
.preview-divider::before,
.preview-divider::after {
    content: '';
    height: 1px;
    flex: 1;
    background: linear-gradient(90deg, transparent, #cbb58f);
}
.preview-divider::after {
    transform: rotate(180deg);
}
.preview-ability-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5px;
}
.preview-ability-grid > div {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 6px 3px;
    border: 1px solid #e0d0b2;
    border-radius: 7px;
    background: rgba(255, 250, 239, 0.75);
}
.preview-ability-grid small {
    color: #85715a;
    font-size: 0.55rem;
}
.preview-ability-grid b {
    color: #493420;
    font-size: 0.95rem;
}
.preview-ability-grid span {
    color: #875f31;
    font-size: 0.68rem;
    font-weight: 800;
}
.preview-section {
    margin-top: 13px;
    padding-top: 10px;
    border-top: 1px solid rgba(171, 143, 99, 0.3);
}
.preview-section h3 {
    margin: 0 0 7px;
    color: #654346;
    font-family: var(--font-serif);
    font-size: 0.78rem;
}
.preview-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
}
.preview-skill {
    display: grid;
    gap: 1px;
    padding: 4px 6px;
    border: 1px solid #dfd0b5;
    border-radius: 6px;
    background: rgba(255, 249, 236, 0.8);
}
.preview-skill b {
    color: #59452f;
    font-size: 0.63rem;
}
.preview-skill small {
    color: #8c7454;
    font-size: 0.54rem;
}
.preview-feature-list,
.preview-equipment-list {
    display: grid;
    gap: 4px;
    margin: 0;
    padding-left: 15px;
    color: #63503a;
    font-size: 0.66rem;
    line-height: 1.35;
}
.preview-equipment-list li span {
    color: #997849;
    font-weight: 700;
}
.preview-muted {
    margin: 0;
    color: #9c8a71;
    font-size: 0.67rem;
}
.preview-draft-note {
    margin: 13px 0 0;
    padding: 7px;
    border: 1px solid #e4d2ae;
    border-radius: 7px;
    background: #fcf3df;
    color: #826739;
    font-size: 0.63rem;
    text-align: center;
}
.creation-review {
    text-align: center;
}
.review-medallion,
.finished-seal {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin: 0 auto 12px;
    border: 1px solid #b99967;
    border-radius: 50%;
    background: radial-gradient(circle, #fff7df, #e9d5ab);
    box-shadow: 0 0 0 5px rgba(180, 145, 84, 0.1);
    color: #8d652f;
    font-size: 1.6rem;
}
.creation-review h3,
.creation-finished h3 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1.55rem;
}
.review-identity {
    margin: 6px 0 17px;
    color: #785b3b;
}
.review-abilities {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
}
.review-abilities > span {
    display: grid;
    gap: 3px;
    padding: 8px 4px;
    border: 1px solid #ddc99f;
    border-radius: 9px;
    background: #fbf0d5;
}
.review-abilities small {
    color: #8b7453;
    font-size: 0.62rem;
    text-transform: uppercase;
}
.review-abilities b {
    color: #493420;
    font-size: 1.1rem;
}
.review-abilities em {
    color: #845a2c;
    font-size: 0.76rem;
    font-style: normal;
    font-weight: 800;
}
.review-bottom {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 17px;
    text-align: left;
}
.review-bottom > div {
    padding: 11px;
    border: 1px solid #e1d1b3;
    border-radius: 9px;
    background: rgba(255, 249, 235, 0.65);
}
.review-bottom strong {
    color: #604238;
    font-family: var(--font-serif);
    font-size: 0.78rem;
}
.review-bottom p {
    margin: 5px 0 0;
    color: #746047;
    font-size: 0.72rem;
    line-height: 1.45;
}
.creation-finished {
    display: grid;
    justify-items: center;
    align-content: center;
    min-height: 450px;
    padding: 30px 16px;
    border: 1px solid #c5a96f;
    border-radius: 12px;
    background:
        radial-gradient(ellipse at 50% 40%, rgba(234, 211, 165, 0.55), transparent 58%),
        linear-gradient(145deg, #fff9e9, #f0dfbf);
    text-align: center;
    animation: creation-finish-in 0.55s both;
}
.finished-seal {
    width: 82px;
    height: 82px;
    margin-bottom: 17px;
    font-size: 2.2rem;
    box-shadow:
        0 0 0 8px rgba(180, 145, 84, 0.1),
        0 8px 25px rgba(92, 62, 25, 0.12);
}
.creation-finished .c-eyebrow {
    margin-bottom: 6px;
}
.creation-finished h3 {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
}
.creation-finished > p:not(.c-eyebrow) {
    max-width: 440px;
    color: #755a3e;
    line-height: 1.5;
}
.finished-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-top: 15px;
}
.creation-step-enter-active,
.creation-step-leave-active {
    transition:
        opacity 0.16s ease,
        transform 0.16s ease;
}
.creation-step-enter-from {
    opacity: 0;
    transform: translateY(7px);
}
.creation-step-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
@keyframes creation-card-in {
    from {
        opacity: 0;
        transform: translateY(5px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
@keyframes creation-finish-in {
    from {
        opacity: 0;
        transform: scale(0.985);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
@media (max-width: 1120px) {
    .creation-workspace {
        grid-template-columns: minmax(0, 1fr) 270px;
        gap: 13px;
    }
    .creation-skill-row {
        grid-template-columns: minmax(100px, 0.8fr) minmax(100px, 0.8fr);
    }
}
@media (max-width: 900px) {
    .creation-workspace {
        grid-template-columns: minmax(0, 1fr);
    }
    .character-preview {
        position: relative;
        top: auto;
        display: grid;
        grid-template-columns: 100px minmax(0, 1fr) minmax(180px, 0.8fr);
        align-items: center;
        gap: 8px 14px;
        padding: 13px;
    }
    .preview-bookmark {
        grid-column: 1 / -1;
        margin: -13px -13px 4px;
    }
    .preview-portrait {
        grid-row: span 2;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
    }
    .portrait-frame {
        width: 54px;
        height: 54px;
        flex-basis: 54px;
    }
    .portrait-caption {
        text-align: center;
        font-size: 0.57rem;
    }
    .preview-identity {
        margin: 0;
        text-align: left;
    }
    .preview-identity .c-eyebrow {
        font-size: 0.5rem;
    }
    .preview-identity h2 {
        font-size: 1rem;
    }
    .preview-class-row {
        justify-content: flex-start;
    }
    .preview-identity > small {
        margin-top: 2px;
    }
    .preview-divider {
        grid-column: 2 / -1;
        margin: 2px 0;
    }
    .preview-ability-grid {
        grid-column: 2 / -1;
        grid-template-columns: repeat(6, minmax(0, 1fr));
    }
    .preview-section {
        margin-top: 2px;
        padding-top: 6px;
    }
    .preview-section:nth-of-type(5) {
        grid-column: 1 / 2;
        grid-row: 4 / span 2;
    }
    .preview-draft-note {
        grid-column: 1 / -1;
        margin-top: 1px;
    }
    .character-preview.compact .preview-feature-list li:nth-child(n + 4),
    .character-preview.compact .preview-equipment-list li:nth-child(n + 5) {
        display: none;
    }
}
@media (max-width: 600px) {
    .creation-hero {
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 11px;
    }
    .creation-hero-mark {
        width: 46px;
        height: 46px;
        font-size: 1.5rem;
    }
    .creation-progress-copy {
        grid-column: 2;
        display: flex;
        align-items: center;
        justify-self: start;
        gap: 7px;
    }
    .creation-progress-copy strong,
    .creation-progress-copy span {
        font-size: 0.68rem;
    }
    .creation-step-nav {
        padding: 9px 8px;
    }
    .creation-step-nav ol {
        min-width: 720px;
    }
    .creation-step-nav .step-label {
        font-size: 0.64rem;
    }
    .creation-step-panel {
        min-height: auto;
    }
    .creation-rune {
        flex-basis: 36px;
        width: 36px;
        height: 36px;
    }
    .selection-grid,
    .subrace-selection-grid,
    .background-selection-grid,
    .equipment-selection-grid {
        grid-template-columns: minmax(0, 1fr);
    }
    .selection-card {
        min-height: 0;
    }
    .creation-identity-fields,
    .creation-identity-fields > :first-child {
        grid-template-columns: minmax(0, 1fr);
        grid-column: auto;
    }
    .creation-ability-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .creation-skill-row {
        grid-template-columns: minmax(0, 1fr);
        gap: 7px;
    }
    .creation-navigation {
        bottom: 0;
        margin: 17px -15px -15px;
        padding: 11px 15px max(11px, env(safe-area-inset-bottom));
        border-top: 1px solid #d9c6a3;
        background: rgba(255, 249, 236, 0.97);
        box-shadow: 0 -6px 16px rgba(69, 48, 26, 0.07);
    }
    .creation-navigation :deep(.n-button) {
        min-height: 44px;
        min-width: 86px;
    }
    .character-preview {
        grid-template-columns: 68px minmax(0, 1fr);
        gap: 7px 10px;
        padding: 11px;
    }
    .preview-bookmark {
        margin: -11px -11px 3px;
    }
    .preview-portrait {
        grid-row: auto;
    }
    .preview-identity {
        grid-column: 2;
    }
    .preview-divider,
    .preview-ability-grid {
        grid-column: 1 / -1;
    }
    .preview-section:nth-of-type(5) {
        grid-column: 1 / -1;
        grid-row: auto;
    }
    .preview-section:nth-of-type(6),
    .preview-section:nth-of-type(7) {
        grid-column: 1 / -1;
    }
    .preview-badges {
        gap: 4px;
    }
    .review-abilities {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .review-bottom {
        grid-template-columns: minmax(0, 1fr);
    }
    .creation-finished {
        min-height: 380px;
    }
    .finished-actions {
        flex-direction: column;
        width: 100%;
    }
    .finished-actions :deep(.n-button) {
        width: 100%;
        min-height: 44px;
    }
}
@media (max-width: 390px) {
    .creation-hero-copy h1 {
        font-size: 1.3rem;
    }
    .creation-hero-copy .c-section-note {
        font-size: 0.78rem;
    }
    .creation-ability-grid {
        grid-template-columns: minmax(0, 1fr);
    }
    .creation-step-nav ol {
        min-width: 700px;
    }
    .skill-step-summary {
        gap: 5px;
    }
    .skill-step-summary span {
        padding: 5px 7px;
        font-size: 0.66rem;
    }
    .creation-navigation {
        gap: 7px;
    }
    .creation-navigation :deep(.n-button) {
        min-width: 75px;
        padding-inline: 10px;
    }
}
@media (prefers-reduced-motion: reduce) {
    .creation-step-enter-active,
    .creation-step-leave-active,
    .selection-card,
    .creation-step-nav .step-number,
    .creation-progress-track span {
        transition: none;
        animation: none;
    }
}
.creation-skill-choice {
    grid-template-columns: minmax(0, 1fr) auto 38px;
    width: 100%;
    min-height: 62px;
    color: inherit;
    text-align: left;
    font: inherit;
    background: transparent;
    cursor: pointer;
}
.creation-skill-choice:hover:not(:disabled) {
    border-color: #d0b788;
    background: rgba(255, 249, 236, 0.72);
}
.creation-skill-choice.selected {
    border-color: #b9c49f;
    background: #edf1e5;
}
.creation-skill-choice:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.creation-skill-choice-source {
    color: #806c53;
    font-size: 0.68rem;
    font-weight: 700;
    white-space: nowrap;
}
.creation-skill-selection-check {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 2px solid #c7b79d;
    border-radius: 50%;
    color: transparent;
    font-size: 1.35rem;
    font-weight: 900;
    line-height: 1;
}
.creation-skill-selection-check.visible {
    border-color: #54705b;
    background: #54705b;
    color: #fffdf5;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.22);
}
.creation-hero,
.creation-step-panel,
.character-preview {
    border-radius: 10px;
    border-color: #c4a474;
    box-shadow:
        0 7px 18px rgba(83, 59, 38, 0.08),
        inset 0 1px rgba(255, 255, 255, 0.7);
}
.creation-hero {
    background:
        radial-gradient(ellipse at 10% 0%, rgba(205, 165, 98, 0.23), transparent 54%),
        linear-gradient(135deg, rgba(255, 250, 237, 0.96), rgba(240, 221, 187, 0.82));
}
.creation-step-panel {
    background: linear-gradient(145deg, rgba(255, 250, 239, 0.93), rgba(249, 235, 207, 0.8));
}
.creation-step-nav {
    border-color: #c4a474;
    background: rgba(255, 247, 228, 0.78);
    box-shadow: 0 3px 9px rgba(83, 59, 38, 0.05);
}
.creation-step-nav .step-number {
    border-color: #c4a474;
}
.creation-step-nav li.active .step-number {
    border-color: var(--sheet-burgundy);
    background: var(--sheet-burgundy);
}
.selection-card {
    border-color: #d0b788;
    background: linear-gradient(145deg, rgba(255, 252, 244, 0.93), rgba(247, 236, 215, 0.78));
}
.selection-card:hover:not(:disabled) {
    border-color: #ae804d;
}
.selection-card.selected {
    border-color: var(--sheet-burgundy);
    background: linear-gradient(145deg, #fff9e9, #f2dfba);
    box-shadow:
        0 0 0 3px rgba(122, 62, 67, 0.13),
        0 7px 17px rgba(77, 49, 22, 0.09);
}
.selection-check {
    background: var(--sheet-burgundy);
}
.character-preview {
    background: linear-gradient(160deg, rgba(255, 251, 239, 0.97), rgba(238, 221, 190, 0.9));
}
.preview-bookmark {
    background: var(--sheet-burgundy);
}
@media (prefers-reduced-motion: reduce) {
    .selection-card {
        transition: none;
        animation: none;
    }
}
@media (max-width: 600px) {
    .class-icon,
    .species-icon,
    .background-icon {
        width: 96px;
        height: 96px;
    }
    .species-preview-frame {
        flex-basis: 96px;
        width: 96px;
        height: 96px;
    }
}
</style>
