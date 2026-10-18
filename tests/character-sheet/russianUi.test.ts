import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.resolve(testDirectory, '../../src')
const uiRoots = [
  path.join(srcRoot, 'modules/character-sheet/components'),
  path.join(srcRoot, 'modules/table-components/components'),
  path.join(srcRoot, 'modules/table-components/TableComponentsShowcase.vue'),
  path.join(srcRoot, 'modules/character-sheet/data/rules2024/index.ts'),
]

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(entryPath) : /\.(vue|ts)$/.test(entry.name) ? [entryPath] : []
  })
}

test('user-facing UI does not contain known English phrases', () => {
  const forbiddenPatterns = [
    /rules layer/i,
    />[^<\r\n]*\bchoices\b[^<\r\n]*</i,
    />[^<\r\n]*\bmetadata\b[^<\r\n]*</i,
    /\bfloor\s*\(/i,
    />\s*(?:Dice Roller|Initiative Tracker|Ready|History|Clear|Save|Cancel|Edit|Delete)\s*</i,
    />\s*(?:LOCAL COMPONENT|SHOWCASE)\s*</i,
  ]
  const violations: string[] = []

  const files = uiRoots.flatMap((root) => fs.statSync(root).isDirectory() ? sourceFiles(root) : [root])
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) violations.push(`${path.relative(srcRoot, file)}: ${pattern}`)
    }
  }

  assert.deepEqual(violations, [])
})
