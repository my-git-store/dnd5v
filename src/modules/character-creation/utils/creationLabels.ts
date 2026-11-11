import type { SpellProgressionType } from '@/types/rules'

export function spellProgressionLabel(value: SpellProgressionType): string {
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
