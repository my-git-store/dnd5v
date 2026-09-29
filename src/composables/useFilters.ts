export function searchFilterObject<T extends object>(items: T[], params: (keyof T)[], search: string): T[] {
    const searchValue = search.toLowerCase();
    return items.filter(item =>
        params.some(param =>
            String(item[param]).toLowerCase().includes(searchValue)
        )
    );
}
