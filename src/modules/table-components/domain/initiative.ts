export interface InitiativeParticipant {
  id: string
  name: string
  initiative: number
}

export function sortInitiative(participants: readonly InitiativeParticipant[]): InitiativeParticipant[] {
  return [...participants].sort((left, right) => right.initiative - left.initiative || left.name.localeCompare(right.name, 'ru'))
}

export function currentParticipantIndex(participants: readonly InitiativeParticipant[], participantId: string | undefined): number {
  return participantId ? participants.findIndex((participant) => participant.id === participantId) : -1
}

export function currentParticipantIdAfterRemoval(
  participants: readonly InitiativeParticipant[],
  currentId: string | undefined,
  removedId: string,
): string | undefined {
  if (currentId !== removedId) return currentId
  const removedIndex = participants.findIndex((participant) => participant.id === removedId)
  const remaining = participants.filter((participant) => participant.id !== removedId)
  return remaining[Math.min(Math.max(removedIndex, 0), remaining.length - 1)]?.id
}

export function nextTurnIndex(currentIndex: number, participantCount: number): { index: number; roundAdvanced: boolean } {
  if (participantCount <= 0) return { index: -1, roundAdvanced: false }
  const next = currentIndex + 1
  return next >= participantCount ? { index: 0, roundAdvanced: true } : { index: next, roundAdvanced: false }
}
