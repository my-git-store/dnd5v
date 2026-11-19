const entryKeys = new WeakMap<object, symbol>()

export function getEntryKey(entry: object): symbol {
    let key = entryKeys.get(entry)
    if (!key) {
        key = Symbol()
        entryKeys.set(entry, key)
    }
    return key
}
