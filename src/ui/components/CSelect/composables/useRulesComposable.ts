export function useRulesResult(rules: Function[] = [], val: unknown) {
    for (const rule of rules) {
        const result = rule(val)
        if (result !== true) return result // возвращаем строку ошибки
    }
    return true
}