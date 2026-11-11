import { computed } from 'vue'

import { getRules2024ClassFeatures } from '@/data/rules2024'

import type {
    CreationDraft,
    CreationOptions,
    CreationPreview,
    CreationCharacterSource,
} from '../types/characterCreation'

export function useCreationPreview(
    draft: CreationDraft,
    options: CreationOptions,
    character: CreationCharacterSource,
): CreationPreview {
    const { name, classId, classEquipmentId, backgroundEquipmentId } = draft

    const { selectedRace, classEquipmentOptions, backgroundEquipmentOptions } = options

    const previewClassFeatures = computed(() =>
        getRules2024ClassFeatures(classId.value, character().level).map(feature => feature.name),
    )

    const initials = computed(
        () =>
            name.value
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(part => part[0]?.toLocaleUpperCase('ru-RU') ?? '')
                .join('') || '✦',
    )

    const selectedClassKit = computed(() =>
        classEquipmentOptions.value.find(option => option.id === classEquipmentId.value),
    )

    const selectedBackgroundKit = computed(() =>
        backgroundEquipmentOptions.value.find(option => option.id === backgroundEquipmentId.value),
    )

    const previewEquipment = computed(() => [
        ...(selectedBackgroundKit.value?.items.map(item => ({ ...item, source: 'Предыстория' })) ??
            []),
        ...(selectedClassKit.value?.items.map(item => ({ ...item, source: 'Класс' })) ?? []),
    ])

    const previewFeatures = computed(() =>
        [...selectedRace.value.profile.traits, ...previewClassFeatures.value].filter(Boolean),
    )
    return { initials, selectedClassKit, selectedBackgroundKit, previewEquipment, previewFeatures }
}
