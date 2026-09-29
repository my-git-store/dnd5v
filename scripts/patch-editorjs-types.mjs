import { readFileSync, writeFileSync } from 'node:fs'

// EditorJS ships executable enums inside its types directory. These files are
// declarations only; marking them ambient preserves types and runtime bundles.
for (const relative of [
  'tools/adapters/tool-type.ts',
  'utils/popover/popover-event.ts',
  'utils/popover/popover-item-type.ts',
]) {
  const file = new URL('../node_modules/@editorjs/editorjs/types/' + relative, import.meta.url)
  const source = readFileSync(file, 'utf8')
  if (source.includes('export declare enum ')) continue
  if (!source.includes('export enum ')) throw new Error('EditorJS declarations changed: ' + relative)
  writeFileSync(file, source.replace('export enum ', 'export declare enum '))
}
