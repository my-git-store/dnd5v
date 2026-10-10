import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { RULES_2024_BACKGROUNDS, RULES_2024_FEATS, getRules2024Feat, isRules2024FeatId } from '../../src/modules/character-sheet/data/rules2024/index.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { applyCharacterCreation } from '../../src/modules/character-sheet/domain/characterCreation.ts'
import { migrateCharacterToV3, migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterSheetView } from '../../src/modules/character-sheet/types/characterView.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'
import { validateCharacterV3 } from '../../src/modules/character-sheet/validation/characterV3Validation.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
}

function payload(backgroundId: string, baseAbilities: CharacterSheetView['abilities'], originFeatId = getBackgroundFeat(backgroundId)): Parameters<typeof applyCharacterCreation>[1] {
  return {
    ruleset: '2024', speciesId: 'human', raceId: 'human', classId: 'wizard', backgroundId, originFeatId,
    originAbilityChoices: [...(RULES_2024_BACKGROUNDS.find((item) => item.id === backgroundId)?.abilityOptions ?? [])],
    originAbilityFocus: RULES_2024_BACKGROUNDS.find((item) => item.id === backgroundId)?.abilityOptions[0], name: 'Архивариус', subclass: '', alignment: '', baseAbilities,
    classSkillIds: ['arcana', 'history'], raceSkillChoices: [], raceAbilityChoices: [],
  }
}

function getBackgroundFeat(backgroundId: string): string {
  return RULES_2024_BACKGROUNDS.find((item) => item.id === backgroundId)!.originFeatId
}

async function loadView(storage: MemoryStorage): Promise<{ adapter: ReturnType<typeof createCharacterSheetAdapter>; view: CharacterSheetView }> {
  const source = migrateCharacterV2ToV3(createMockCharacter())
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  return { adapter, view: await adapter.load(source.id) }
}

test('uses one tagged origin feat format with strict lookup and metadata', () => {
  assert.ok(RULES_2024_FEATS.length > 0)
  assert.equal(new Set(RULES_2024_FEATS.map((feat) => feat.id)).size, RULES_2024_FEATS.length)
  assert.ok(RULES_2024_FEATS.every((feat) => feat.ruleset === '2024' && feat.category === 'origin' && feat.name === feat.label && feat.description && feat.source && Array.isArray(feat.prerequisites) && feat.effectsMetadata.length > 0))
  assert.ok(RULES_2024_FEATS.every((feat) => feat.effectsMetadata.every((effect) => effect.source === feat.id)))
  assert.ok(getRules2024Feat('alert'))
  assert.equal(getRules2024Feat('missing-feat'), undefined)
  assert.equal(isRules2024FeatId('alert'), true)
  assert.equal(isRules2024FeatId('missing-feat'), false)
})

test('stores background origin feat as a canonical ID and changes it with background', () => {
  const base = migrateCharacterV2ToV3(createMockCharacter())
  const view = { ...base, schemaVersion: 2 as const, name: base.identity.name, class: base.identity.class, level: base.identity.level, experience: base.identity.experience, armorClass: base.combat.armorClass.value, abilities: { ...base.abilities }, skills: base.skills, attacks: base.attacks, spells: base.spellcasting.knownSpells, cantrips: base.spellcasting.cantrips, inventory: base.inventory.items.map(({ id, name, quantity, description }) => ({ id, name, quantity, description })), money: base.inventory.money, bio: { biography: base.personality.biography, traits: base.personality.traits, features: base.personality.features }, race: base.identity.race, subclass: base.identity.subclass, background: base.identity.background, alignment: base.identity.alignment, savingThrows: base.savingThrows, proficiency: base.proficiency, combat: base.combat, spellcasting: base.spellcasting, inventoryData: base.inventory, personality: base.personality, origin: base.origin, ruleset: base.ruleset } as CharacterSheetView
  const sage = applyCharacterCreation(view, payload('sage-2024', view.abilities))
  assert.equal(sage.creation?.originFeatId, 'magic-initiate-wizard')
  assert.equal(sage.origin.featId, 'magic-initiate-wizard')
  assert.equal(sage.origin.originFeat, getRules2024Feat('magic-initiate-wizard')?.label)
  const hermit = applyCharacterCreation(sage, payload('hermit-2024', view.abilities))
  assert.equal(hermit.creation?.originFeatId, 'healer')
  assert.equal(hermit.origin.featId, 'healer')
  assert.equal(hermit.origin.originFeat, getRules2024Feat('healer')?.label)
})

test('rejects unknown or mismatched origin feats instead of falling back', async () => {
  const { view } = await loadView(new MemoryStorage())
  assert.throws(() => applyCharacterCreation(view, payload('sage-2024', view.abilities, 'missing-feat')), /Неизвестная черта/)
  assert.throws(() => applyCharacterCreation(view, payload('sage-2024', view.abilities, 'healer')), /не соответствует/)

  const oldV3 = migrateCharacterV2ToV3(createMockCharacter())
  oldV3.ruleset = '2024'
  oldV3.origin.featId = 'missing-feat'
  oldV3.extensions.characterCreation = { speciesId: 'human', backgroundId: 'sage-2024', originFeatId: 'missing-feat' }
  assert.ok(validateCharacterV3(oldV3).some((error) => error.includes('origin') || error.includes('предыстория D&D 2024')))
})

test('round-trips feat reference and keeps non-feat collections intact', async () => {
  const storage = new MemoryStorage()
  const { adapter, view } = await loadView(storage)
  const created = applyCharacterCreation(view, payload('sage-2024', view.abilities))
  const spellDescription = created.spells[0]?.description
  const attackBonus = created.attacks[0]?.attackBonus
  const itemId = created.inventoryData.items[0]?.id
  await adapter.save(created)
  const raw = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${created.id}`)!) as CharacterV3
  assert.equal(raw.origin.featId, 'magic-initiate-wizard')
  assert.equal(raw.extensions.characterCreation && (raw.extensions.characterCreation as { originFeatId?: string }).originFeatId, 'magic-initiate-wizard')
  assert.equal(raw.origin.originFeat, 'Посвящённый в магию: волшебник')
  assert.equal(raw.spellcasting.knownSpells[0]?.description, spellDescription)
  assert.equal(raw.attacks[0]?.attackBonus, attackBonus)
  assert.equal(raw.inventory.items.some((item) => item.id === itemId), true)
  assert.deepEqual(validateCharacterV3(raw), [])
  const reloaded = await adapter.load(created.id)
  assert.equal(reloaded.origin.featId, 'magic-initiate-wizard')
  assert.equal(reloaded.creation?.originFeatId, 'magic-initiate-wizard')
})

test('supports feat source metadata without applying a rules engine', () => {
  const base = migrateCharacterV2ToV3(createMockCharacter())
  const storage = new MemoryStorage()
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${base.id}`, JSON.stringify(base))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })
  return adapter.load(base.id).then((view) => {
    const created = applyCharacterCreation(view, payload('sage-2024', view.abilities))
    const arcana = created.skills.find((skill) => skill.id === 'arcana')!
    arcana.proficiencySources = [...new Set([...(arcana.proficiencySources ?? []), 'feat'])]
    created.creation!.abilityBonusSources!.strength = [{ source: 'feat', amount: 1 }]
    created.proficiency.languageSources = { Драконий: [{ kind: 'feat', id: 'magic-initiate-wizard', label: 'Посвящённый в магию' }] }
    const switched = applyCharacterCreation(created, payload('hermit-2024', view.abilities))
    assert.equal(switched.skills.find((skill) => skill.id === 'arcana')?.proficiencySources?.includes('feat'), true)
    assert.deepEqual(switched.creation?.abilityBonusSources?.strength, [{ source: 'feat', amount: 1 }])
    assert.equal(switched.proficiency.languageSources?.Драконий?.[0]?.kind, 'feat')
  })
})

test('old v3 without feat ID remains valid and gets no fabricated feat', () => {
  const oldV3 = migrateCharacterToV3(migrateCharacterV2ToV3(createMockCharacter()))
  delete oldV3.origin.featId
  assert.equal(oldV3.origin.originFeat, '')
  assert.deepEqual(validateCharacterV3(oldV3), [])
})
