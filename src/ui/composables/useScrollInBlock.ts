export function scrollToBlock(blockId: string) {
    const el = document.getElementById(`${blockId}`)
    if (el) {
        el?.scrollIntoView({behavior: 'smooth'})
        return true
    } else {
        return false
    }
}