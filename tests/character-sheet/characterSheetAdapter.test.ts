import test from 'node:test'
import assert from 'node:assert/strict'
import { createCharacterSheetAdapter } from '../../src/api/characterSheetAdapter.ts'
import { CHARACTER_STORAGE_PREFIX, type CharacterStorageLike } from '../../src/api/characterStorage.ts'
import { createMockCharacter } from '../../src/data/character.mock.ts'
import { calculateSavingThrowBonus } from '../../src/domain/savingThrow.ts'
import type { Character } from '../../src/types/character.ts'

class MemoryStorage implements CharacterStorageLike {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

test('loads a current record into the current UI projection', async () => {
  const storage = new MemoryStorage()

  const character = createMockCharacter()
  character.identity.name = 'Имя персонажа'
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${character.id}`, JSON.stringify(character))
  const adapter = createCharacterSheetAdapter({ storage })

  const uiCharacter = await adapter.load(character.id)

  assert.equal(uiCharacter.schemaVersion, 3)
  assert.equal(uiCharacter.name, 'Имя персонажа')
  assert.equal(uiCharacter.armorClass, character.combat.armorClass.value)
  assert.equal(uiCharacter.spells[0]?.name, character.spellcasting.knownSpells[0]?.name)
  assert.equal(uiCharacter.race.name, character.identity.race.name)
  assert.deepEqual(uiCharacter.savingThrows, character.savingThrows)
})

test('saves UI changes through the current adapter', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))

  const adapter = createCharacterSheetAdapter({ storage })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.name = 'Изменено через UI'
  uiCharacter.skills[0]!.value = -3
  uiCharacter.attacks[0]!.attackBonus = '1d20+6'

  const savedUiCharacter = await adapter.save(uiCharacter)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character

  assert.equal(savedUiCharacter.name, 'Изменено через UI')
  assert.equal(saved.identity.name, 'Изменено через UI')
  assert.equal(saved.skills[0]?.value, -3)
  assert.equal(saved.attacks[0]?.attackBonus, '1d20+6')
  assert.equal(saved.schemaVersion, 3)
})

test('preserves current fields that are not represented by the UI', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()

  const current = source
  current.identity.race.name = 'Эльф'
  current.identity.background.name = 'Отшельник'
  current.combat.hitPoints.max = 18
  current.spellcasting.knownSpells[0]!.school = 'Ограждение'
  current.inventory.items[0]!.weight = 2
  current.inventory.items[0]!.equipped = true
  current.personality.ideals = 'Знание выше страха'
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(current))
  const adapter = createCharacterSheetAdapter({ storage })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.name = 'Новое имя'
  await adapter.save(uiCharacter)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character

  assert.equal(saved.identity.name, 'Новое имя')
  assert.equal(saved.identity.race.name, 'Эльф')
  assert.equal(saved.identity.background.name, 'Отшельник')
  assert.equal(saved.combat.hitPoints.max, 18)
  assert.equal(saved.spellcasting.knownSpells[0]?.school, 'Ограждение')
  assert.equal(saved.inventory.items[0]?.weight, 2)
  assert.equal(saved.inventory.items[0]?.equipped, true)
  assert.equal(saved.personality.ideals, 'Знание выше страха')
})

test('round-trips identity, saving throws and skill settings through the UI projection', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()

  const current = source
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(current))
  const adapter = createCharacterSheetAdapter({ storage })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.race.name = 'Эльф'
  uiCharacter.subclass = 'Колдунский покровитель'
  uiCharacter.background.name = 'Отшельник'
  uiCharacter.alignment = 'Нейтрально-добрый'
  uiCharacter.savingThrows.dexterity.proficient = true
  uiCharacter.skills[0]!.calculationMode = 'computed'
  uiCharacter.skills[0]!.additionalBonus = 2

  await adapter.save(uiCharacter)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character

  assert.equal(saved.identity.race.name, 'Эльф')
  assert.equal(saved.identity.subclass, 'Колдунский покровитель')
  assert.equal(saved.identity.background.name, 'Отшельник')
  assert.equal(saved.identity.alignment, 'Нейтрально-добрый')
  assert.equal(saved.savingThrows.dexterity.proficient, true)
  assert.deepEqual(saved.savingThrows.dexterity, { proficient: true })
  assert.equal(saved.skills[0]?.calculationMode, 'computed')
  assert.equal(saved.skills[0]?.additionalBonus, 2)
})

test('loads legacy saving throw bonuses without applying them after save and reload', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()
  source.identity.level = 5
  source.abilities.dexterity = 14
  Object.assign(source.savingThrows.dexterity, { proficient: true, additionalBonus: 9 })
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(source))
  const adapter = createCharacterSheetAdapter({ storage })

  const loaded = await adapter.load(source.id)
  assert.equal(calculateSavingThrowBonus({ ability: 'dexterity', ...loaded.savingThrows.dexterity }, loaded.abilities, loaded.level), 5)

  loaded.savingThrows.dexterity.proficient = false
  await adapter.save(loaded)
  const reloaded = await adapter.load(source.id)
  assert.equal(calculateSavingThrowBonus({ ability: 'dexterity', ...reloaded.savingThrows.dexterity }, reloaded.abilities, reloaded.level), 2)
})

test('round-trips combat stats and the full attack editor shape without losing bonus text', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()

  const current = source
  current.combat.armorClass.mode = 'computed'
  current.combat.armorClass.armorBase = 13
  current.combat.armorClass.armorDexCap = 2
  current.combat.hitPoints = { max: 24, current: 18, temporary: 3 }
  current.combat.hitDice = { size: 'd8', total: 4, spent: 1 }
  current.combat.deathSaves = { successes: 1, failures: 2 }
  current.attacks[0] = { ...current.attacks[0]!, kind: 'ranged', abilitySource: 'dexterity', proficient: true, calculationMode: 'computed', attackBonus: '1d20+5', damageType: 'piercing', properties: ['Боеприпасы'], range: '80/320' }
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(current))
  const adapter = createCharacterSheetAdapter({ storage })

  const uiCharacter = await adapter.load(source.id)
  uiCharacter.combat.hitPoints.current = 12
  uiCharacter.combat.deathSaves.failures = 3
  uiCharacter.attacks[0]!.calculationMode = 'manual'
  uiCharacter.attacks[0]!.attackBonus = '1d20+5'
  uiCharacter.attacks[0]!.damageType = 'рубящий'
  uiCharacter.attacks[0]!.properties = ['Двуручное']
  await adapter.save(uiCharacter)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character
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

  const current = source
  current.spellcasting.spellcastingAbility = 'intelligence'
  current.spellcasting.preparedSpellIds = ['spell-1']
  current.spellcasting.spellSlots[1] = { max: 4, used: 2 }
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(current))
  const adapter = createCharacterSheetAdapter({ storage })

  const uiCharacter = await adapter.load(source.id)
  assert.equal(uiCharacter.spellcasting.spellcastingAbility, 'intelligence')
  assert.deepEqual(uiCharacter.spellcasting.preparedSpellIds, ['spell-1'])
  assert.deepEqual(uiCharacter.spellcasting.spellSlots[1], { max: 4, used: 2 })
  uiCharacter.spellcasting.preparedSpellIds = []
  uiCharacter.spellcasting.spellSlots[1]!.used = 4
  await adapter.save(uiCharacter)

  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character
  assert.deepEqual(saved.spellcasting.preparedSpellIds, [])
  assert.deepEqual(saved.spellcasting.spellSlots[1], { max: 4, used: 4 })
})

test('round-trips full inventory item metadata and personality fields', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()

  const current = source
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(current))
  const adapter = createCharacterSheetAdapter({ storage })

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

  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character
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

test('round-trips user-authored feats and keeps old records empty', async () => {
  const storage = new MemoryStorage()

  const source = createMockCharacter()

  const current = source
  storage.setItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`, JSON.stringify(current))
  const adapter = createCharacterSheetAdapter({ storage })

  const empty = await adapter.load(source.id)
  assert.deepEqual(empty.feats, [])
  empty.feats.push({ id: 'feat-test', name: 'Наблюдатель', description: 'Замечает детали.' })
  await adapter.save(empty)
  const reloaded = await adapter.load(source.id)
  assert.deepEqual(reloaded.feats, [{ id: 'feat-test', name: 'Наблюдатель', description: 'Замечает детали.' }])

  reloaded.feats[0]!.description = 'Обновлённое описание.'
  reloaded.feats = reloaded.feats.filter((feat) => feat.id !== 'missing')
  await adapter.save(reloaded)
  const saved = JSON.parse(storage.getItem(`${CHARACTER_STORAGE_PREFIX}${source.id}`)!) as Character
  assert.deepEqual(saved.feats, [{ id: 'feat-test', name: 'Наблюдатель', description: 'Обновлённое описание.' }])
})
