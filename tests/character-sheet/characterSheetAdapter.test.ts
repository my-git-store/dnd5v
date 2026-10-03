import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/modules/character-sheet/adapters/characterSheetAdapter.ts'
import { CHARACTER_V2_STORAGE_PREFIX, CHARACTER_V3_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/modules/character-sheet/api/characterV3Storage.ts'
import { createMockCharacter } from '../../src/modules/character-sheet/data/character.mock.ts'
import { migrateCharacterV2ToV3 } from '../../src/modules/character-sheet/migration/characterMigrationV3.ts'
import type { CharacterV3 } from '../../src/modules/character-sheet/types/characterV3.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

test('loads a v3 record into the current UI projection', async () => {
  const storage = new MemoryStorage()
  const v3 = migrateCharacterV2ToV3(createMockCharacter())
  v3.identity.name = 'Имя v3'
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${v3.id}`, JSON.stringify(v3))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(v3.id)

  assert.equal(uiCharacter.schemaVersion, 2)
  assert.equal(uiCharacter.name, 'Имя v3')
  assert.equal(uiCharacter.armorClass, v3.combat.armorClass.value)
  assert.equal(uiCharacter.spells[0]?.name, v3.spellcasting.knownSpells[0]?.name)
  assert.equal(uiCharacter.race.name, v3.identity.race.name)
  assert.deepEqual(uiCharacter.savingThrows, v3.savingThrows)
})

test('loads v2, promotes a v3 copy, and leaves the old key untouched', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  storage.setItem(`${CHARACTER_V2_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(source.id)
  const promoted = storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)

  assert.equal(uiCharacter.name, source.name)
  assert.notEqual(promoted, null)
  assert.equal(JSON.parse(promoted!).schemaVersion, 3)
  assert.notEqual(storage.getItem(`${CHARACTER_V2_STORAGE_PREFIX}${source.id}`), null)
})

test('saves UI changes through the v3 adapter', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => source })
  const uiCharacter = await adapter.load(source.id)
  uiCharacter.name = 'Изменено через UI'
  uiCharacter.skills[0]!.value = -3
  uiCharacter.attacks[0]!.attackBonus = '1d20+6'

  const savedUiCharacter = await adapter.save(uiCharacter)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3

  assert.equal(savedUiCharacter.name, 'Изменено через UI')
  assert.equal(saved.identity.name, 'Изменено через UI')
  assert.equal(saved.skills[0]?.value, -3)
  assert.equal(saved.attacks[0]?.attackBonus, '1d20+6')
  assert.equal(saved.schemaVersion, 3)
})

test('preserves v3 fields that are not represented by the current UI', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const v3 = migrateCharacterV2ToV3(source)
  v3.identity.race.name = 'Эльф'
  v3.identity.background.name = 'Отшельник'
  v3.combat.hitPoints.max = 18
  v3.spellcasting.knownSpells[0]!.school = 'Ограждение'
  v3.inventory.items[0]!.weight = 2
  v3.inventory.items[0]!.equipped = true
  v3.personality.ideals = 'Знание выше страха'
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(v3))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.name = 'Новое имя'
  await adapter.save(uiCharacter)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3

  assert.equal(saved.identity.name, 'Новое имя')
  assert.equal(saved.identity.race.name, 'Эльф')
  assert.equal(saved.identity.background.name, 'Отшельник')
  assert.equal(saved.combat.hitPoints.max, 18)
  assert.equal(saved.spellcasting.knownSpells[0]?.school, 'Ограждение')
  assert.equal(saved.inventory.items[0]?.weight, 2)
  assert.equal(saved.inventory.items[0]?.equipped, true)
  assert.equal(saved.personality.ideals, 'Знание выше страха')
})

test('round-trips v3 identity, saving throws and skill settings through the UI projection', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const v3 = migrateCharacterV2ToV3(source)
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(v3))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.race.name = 'Эльф'
  uiCharacter.subclass = 'Колдунский покровитель'
  uiCharacter.background.name = 'Отшельник'
  uiCharacter.alignment = 'Нейтрально-добрый'
  uiCharacter.savingThrows.dexterity.proficient = true
  uiCharacter.savingThrows.dexterity.additionalBonus = 1
  uiCharacter.skills[0]!.calculationMode = 'computed'
  uiCharacter.skills[0]!.additionalBonus = 2

  await adapter.save(uiCharacter)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3

  assert.equal(saved.identity.race.name, 'Эльф')
  assert.equal(saved.identity.subclass, 'Колдунский покровитель')
  assert.equal(saved.identity.background.name, 'Отшельник')
  assert.equal(saved.identity.alignment, 'Нейтрально-добрый')
  assert.equal(saved.savingThrows.dexterity.proficient, true)
  assert.equal(saved.savingThrows.dexterity.additionalBonus, 1)
  assert.equal(saved.skills[0]?.calculationMode, 'computed')
  assert.equal(saved.skills[0]?.additionalBonus, 2)
})

test('round-trips combat stats and the full attack editor shape without losing legacy bonus text', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const v3 = migrateCharacterV2ToV3(source)
  v3.combat.armorClass.mode = 'computed'
  v3.combat.armorClass.armorBase = 13
  v3.combat.armorClass.armorDexCap = 2
  v3.combat.hitPoints = { max: 24, current: 18, temporary: 3 }
  v3.combat.hitDice = { size: 'd8', total: 4, spent: 1 }
  v3.combat.deathSaves = { successes: 1, failures: 2 }
  v3.attacks[0] = { ...v3.attacks[0]!, kind: 'ranged', abilitySource: 'dexterity', proficient: true, calculationMode: 'computed', attackBonus: '1d20+5', damageType: 'piercing', properties: ['Боеприпасы'], range: '80/320' }
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(v3))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.combat.hitPoints.current = 12
  uiCharacter.combat.deathSaves.failures = 3
  uiCharacter.attacks[0]!.calculationMode = 'manual'
  uiCharacter.attacks[0]!.attackBonus = '1d20+5'
  uiCharacter.attacks[0]!.damageType = 'рубящий'
  uiCharacter.attacks[0]!.properties = ['Двуручное']
  await adapter.save(uiCharacter)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3
  assert.equal(saved.combat.armorClass.mode, 'computed')
  assert.equal(saved.combat.hitPoints.current, 12)
  assert.equal(saved.combat.deathSaves.failures, 3)
  assert.equal(saved.attacks[0]?.calculationMode, 'manual')
  assert.equal(saved.attacks[0]?.attackBonus, '1d20+5')
  assert.equal(saved.attacks[0]?.damageType, 'рубящий')
  assert.deepEqual(saved.attacks[0]?.properties, ['Двуручное'])
})

test('round-trips spellcasting settings, slots and prepared spell ids', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const v3 = migrateCharacterV2ToV3(source)
  v3.spellcasting.spellcastingAbility = 'intelligence'
  v3.spellcasting.preparedSpellIds = ['spell-1']
  v3.spellcasting.spellSlots[1] = { max: 4, used: 2 }
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(v3))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(source.id)
  assert.equal(uiCharacter.spellcasting.spellcastingAbility, 'intelligence')
  assert.deepEqual(uiCharacter.spellcasting.preparedSpellIds, ['spell-1'])
  assert.deepEqual(uiCharacter.spellcasting.spellSlots[1], { max: 4, used: 2 })
  uiCharacter.spellcasting.preparedSpellIds = []
  uiCharacter.spellcasting.spellSlots[1]!.used = 4
  await adapter.save(uiCharacter)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3
  assert.deepEqual(saved.spellcasting.preparedSpellIds, [])
  assert.deepEqual(saved.spellcasting.spellSlots[1], { max: 4, used: 4 })
})

test('round-trips full inventory item metadata and personality fields', async () => {
  const storage = new MemoryStorage()
  const source = createMockCharacter()
  const v3 = migrateCharacterV2ToV3(source)
  storage.setItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`, JSON.stringify(v3))
  const adapter = createCharacterSheetAdapter({ storage, loadLegacy: async () => { throw new Error('legacy loader must not run') } })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.inventoryData.items[0]!.weight = 2.5
  uiCharacter.inventoryData.items[0]!.equipped = true
  uiCharacter.inventoryData.items[0]!.properties = ['Фокус', 'Дерево']
  uiCharacter.inventoryData.money.gold = 42
  uiCharacter.personality.traits = 'Спокойно изучает древние руны.'
  uiCharacter.personality.ideals = 'Знание важнее славы.'
  uiCharacter.personality.bonds = 'Академия ждёт возвращения.'
  uiCharacter.personality.flaws = 'Слишком любопытна.'
  uiCharacter.personality.features = 'Тёмное зрение.'
  await adapter.save(uiCharacter)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_V3_STORAGE_PREFIX}${source.id}`)!) as CharacterV3
  assert.equal(saved.inventory.items[0]?.weight, 2.5)
  assert.equal(saved.inventory.items[0]?.equipped, true)
  assert.deepEqual(saved.inventory.items[0]?.properties, ['Фокус', 'Дерево'])
  assert.equal(saved.inventory.money.gold, 42)
  assert.equal(saved.personality.traits, 'Спокойно изучает древние руны.')
  assert.equal(saved.personality.ideals, 'Знание важнее славы.')
  assert.equal(saved.personality.bonds, 'Академия ждёт возвращения.')
  assert.equal(saved.personality.flaws, 'Слишком любопытна.')
  assert.equal(saved.personality.features, 'Тёмное зрение.')
})
