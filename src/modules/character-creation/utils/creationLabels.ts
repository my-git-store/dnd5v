import { ABILITY_FIELDS } from '@/data/characterFields'
import { findRace, findSubrace } from '@/data/dnd5eOptions'
import type { Dnd5eClassOption } from '@/data/dnd5eOptions'
import { signedModifier } from '@/domain/abilityModifier'
import type { CharacterRuleset } from '@/types/character'

export function spellProgressionLabel(value: Dnd5eClassOption['spellProgressionType']): string {
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

export function raceBonusLines(ruleset: CharacterRuleset, raceIdValue: string): string[] {
    if (ruleset === '2024') return ['Бонусы характеристик задаются исходными значениями']
    const race = findRace(raceIdValue)
    return Object.entries(race.profile.abilityBonuses).map(
        ([key, value]) =>
            `${ABILITY_FIELDS.find(field => field.key === key)?.label} ${signedModifier(value ?? 0)}`,
    )
}

export function subraceBonusLines(raceId: string, subraceIdValue: string): string[] {
    const subrace = findSubrace(raceId, subraceIdValue)
    return Object.entries(subrace?.abilityBonuses ?? {}).map(
        ([key, value]) =>
            `${ABILITY_FIELDS.find(field => field.key === key)?.label} ${signedModifier(value ?? 0)}`,
    )
}

export function sourceLabel(source: string): string {
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

export function hideBrokenAsset(event: Event): void {
    const image = event.currentTarget
    if (!(image instanceof HTMLImageElement)) return
    image.hidden = true
    image.parentElement
        ?.querySelector<HTMLElement>('[data-asset-fallback]')
        ?.removeAttribute('hidden')
}

export function choiceOptions(
    choices: string[],
): Array<{ value: string; label: string; disabled?: boolean }> {
    return [
        { value: '', label: 'Выберите вариант', disabled: true },
        ...choices.map(choice => ({ value: choice, label: choice })),
    ]
}
