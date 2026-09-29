import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()
const requests = []
const dataRequests = []
const sockets = []
const errors = []
page.on('request', request => {
  requests.push(request.url())
  if (['fetch', 'xhr'].includes(request.resourceType())) dataRequests.push(request.url())
})
page.on('websocket', socket => sockets.push(socket.url()))
page.on('pageerror', error => errors.push(error.message))
const base = process.env.SHEET_URL || 'http://127.0.0.1:5175'
const tab = name => page.getByRole('tab', { name, exact: true })
const section = title => page.locator('.sheet-section:visible').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
const loaded = () => page.locator('.sheet-header').waitFor()
const report = message => console.log('PASS: ' + message)
try {
  await page.goto(base)
  await loaded()
  if (process.env.BASELINE) {
    await tab('Основное').focus()
    await page.keyboard.press('ArrowRight')
    console.log('Keyboard selects magic:', await tab('Магия / Заклинания').getAttribute('aria-selected'))
    await tab('Магия / Заклинания').click()
    const spells = section('Заклинания')
    await spells.getByRole('button', { name: 'Добавить', exact: true }).click()
    await spells.locator('input').first().fill('Unapplied draft')
    await tab('БИО').click()
    console.log('Textarea accessible name:', await page.locator('textarea').first().getAttribute('aria-label'))
    await tab('Магия / Заклинания').click()
    console.log('Editor survived tab switch:', await spells.locator('.editor-grid').count())
    await page.setViewportSize({ width: 375, height: 812 })
    console.log('Horizontal overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    console.log('Network:', requests.filter(url => !url.startsWith(base)))
  } else {
    assert.equal(await page.getByRole('tab').count(), 4)
    report('normal load and four tabs')
    await tab('Основное').focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await tab('Магия / Заклинания').getAttribute('aria-selected'), 'true')
    await page.keyboard.press('End')
    assert.equal(await tab('БИО').getAttribute('aria-selected'), 'true')
    await page.keyboard.press('ArrowLeft')
    assert.equal(await tab('Инвентарь').getAttribute('aria-selected'), 'true')
    await page.keyboard.press('Home')
    assert.equal(await tab('Основное').getAttribute('aria-selected'), 'true')
    report('keyboard tabs')
    for (const [tabName, title, prefix] of [
      ['Основное', 'Атаки', 'attack'],
      ['Магия / Заклинания', 'Заговоры', 'cantrip'],
      ['Магия / Заклинания', 'Заклинания', 'spell'],
      ['Инвентарь', 'Предметы', 'item'],
    ]) {
      await tab(tabName).click()
      const s = section(title)
      await s.getByRole('button', { name: 'Добавить', exact: true }).click()
      await s.getByLabel('Название', { exact: true }).fill(prefix + '-draft')
      await tab('БИО').click()
      await tab(tabName).click()
      assert.equal(await s.getByLabel('Название', { exact: true }).inputValue(), prefix + '-draft')
      // Invalid submit must retain the open editor.
      await s.getByLabel('Название', { exact: true }).fill('')
      await s.getByRole('button', { name: 'Применить', exact: true }).click()
      assert.equal(await s.locator('.editor-grid').count(), 1)
      await s.getByLabel('Название', { exact: true }).fill(prefix + '-created')
      await s.getByLabel('Описание', { exact: true }).fill('Описание проверки')
      await s.getByRole('button', { name: 'Применить', exact: true }).focus()
      await page.keyboard.press('Enter')
      const row = s.locator('.entry-card').filter({ has: page.getByRole('heading', { name: prefix + '-created', exact: true }) })
      assert.equal(await row.count(), 1)
      await row.getByRole('button', { name: 'Изменить', exact: true }).click()
      await s.getByLabel('Название', { exact: true }).fill(prefix + '-cancelled')
      await s.getByRole('button', { name: 'Отмена', exact: true }).click()
      assert.equal(await row.count(), 1)
      await row.getByRole('button', { name: 'Изменить', exact: true }).click()
      await s.getByLabel('Название', { exact: true }).fill(prefix + '-edited')
      await s.getByRole('button', { name: 'Применить', exact: true }).click()
      const edited = s.locator('.entry-card').filter({ has: page.getByRole('heading', { name: prefix + '-edited', exact: true }) })
      page.once('dialog', dialog => dialog.dismiss())
      await edited.getByRole('button', { name: 'Удалить', exact: true }).click()
      assert.equal(await edited.count(), 1)
      page.once('dialog', dialog => dialog.accept())
      await edited.getByRole('button', { name: 'Удалить', exact: true }).click()
      assert.equal(await edited.count(), 0)
      // Keep one added record to check persistence after reload.
      await s.getByRole('button', { name: 'Добавить', exact: true }).click()
      await s.getByLabel('Название', { exact: true }).fill(prefix + '-persist')
      await s.getByRole('button', { name: 'Применить', exact: true }).click()
      report(title + ': create/read/update/delete, cancel edit/delete, draft across tabs')
    }
    await tab('Основное').click()
    await page.getByRole('textbox', { name: 'Имя персонажа', exact: true }).fill('Проверка сохранения')
    await section('Характеристики').getByLabel('Сила', { exact: true }).fill('17')
    await section('Навыки').getByRole('spinbutton', { name: 'Акробатика', exact: true }).fill('-3')
    await tab('Инвентарь').click()
    await section('Деньги').getByLabel('Золото', { exact: true }).fill('42')
    await tab('БИО').click()
    for (const label of ['Биография', 'Черты характера', 'Особенности персонажа']) {
      await page.getByRole('textbox', { name: label, exact: true }).fill(label + ': сохранённый текст')
    }
    assert.equal(await page.getByText('Сохранено', { exact: true }).count(), 0)
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
    assert.equal(await page.locator('textarea:enabled').count(), 0)
    assert.equal(await page.getByText('Сохранено', { exact: true }).count(), 0)
    await page.getByText('Сохранено', { exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Сохранить', exact: true }).isEnabled(), false)
    const saved = await page.evaluate(() => localStorage.getItem('nastolka:character-sheet:v1:demo-character'))
    assert.ok(saved)
    await page.reload()
    await loaded()
    assert.equal(await page.getByRole('textbox', { name: 'Имя персонажа', exact: true }).inputValue(), 'Проверка сохранения')
    assert.equal(await section('Характеристики').getByLabel('Сила', { exact: true }).inputValue(), '17')
    assert.equal(await section('Навыки').getByRole('spinbutton', { name: 'Акробатика', exact: true }).inputValue(), '-3')
    for (const [tabName, names] of [
      ['Основное', ['attack-persist']],
      ['Магия / Заклинания', ['cantrip-persist', 'spell-persist']],
      ['Инвентарь', ['item-persist']],
    ]) {
      await tab(tabName).click()
      for (const name of names) assert.equal(await page.getByRole('heading', { name, exact: true }).isVisible(), true)
    }
    assert.equal(await section('Деньги').getByLabel('Золото', { exact: true }).inputValue(), '42')
    await tab('БИО').click()
    assert.equal(await page.getByRole('textbox', { name: 'Биография', exact: true }).inputValue(), 'Биография: сохранённый текст')
    report('multi-section save, saving lock, success status and reload persistence')
    // Existing validation error path, not an added failure switch.
    await page.getByRole('textbox', { name: 'Имя персонажа', exact: true }).fill('')
    await page.getByRole('button', { name: 'Сохранить', exact: true }).click()
    assert.equal(await page.getByText('Сохранено', { exact: true }).count(), 0)
    assert.equal(await page.locator('.status-text.error').isVisible(), true)
    assert.equal(await page.getByRole('textbox', { name: 'Биография', exact: true }).inputValue(), 'Биография: сохранённый текст')
    await page.getByRole('textbox', { name: 'Имя персонажа', exact: true }).fill('Проверка сохранения')
    report('validation failure preserves draft; no false success')
    await page.goto(base + '/?mockLoadError=once')
    await page.getByRole('button', { name: 'Повторить', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Повторить', exact: true }).click()
    assert.equal(await page.locator('.load-state').isVisible(), true)
    await page.screenshot({ path: 'tests/character-sheet/loader-check.png' })
    await loaded()
    assert.equal(await page.evaluate(() => localStorage.getItem('nastolka:character-sheet:v1:demo-character')), saved)
    report('controlled mock load error, visible loader on retry, successful retry, storage intact')
    await page.setViewportSize({ width: 375, height: 812 })
    for (const name of ['Основное', 'Магия / Заклинания', 'Инвентарь', 'БИО']) {
      await tab(name).click()
      assert.equal(await tab(name).getAttribute('aria-selected'), 'true')
      const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent?.slice(0, 35), width: el.getBoundingClientRect().width })))
      if (overflow.length) console.log('Overflow details:', overflow)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + ' horizontal overflow')
    }
    await page.screenshot({ path: 'tests/character-sheet/mobile-check.png', fullPage: true, animations: 'disabled' })
    report('375px layout, all four tabs')
    assert.deepEqual(errors, [])
    // Vite serves source files under /src/.../api/; those are scripts, not API calls.
    const unexpected = dataRequests.filter(url => !url.startsWith('https://api.iconify.design/'))
    assert.deepEqual(unexpected, [])
    assert.equal(sockets.every(url => new URL(url).host === new URL(base).host && new URL(url).pathname === '/'), true)
    console.log('External resources:', [...new Set(requests.filter(url => !url.startsWith(base)))])
    console.log('WebSockets (Vite development HMR):', sockets)
    report('no page exceptions or backend/OIDC/Socket.IO requests')
  }
} finally {
  await context.close()
  await browser.close()
}
