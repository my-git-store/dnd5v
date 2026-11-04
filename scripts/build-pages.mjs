import { spawnSync } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npmCommand, ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    VITE_BASE: '/dnd5v/',
    VITE_ENABLE_BESTIARY: 'false',
    VITE_ENABLE_ENCOUNTER_PLANNER: 'false',
    VITE_ENABLE_COMPONENTS: 'false',
  },
})

if (result.error) {
  console.error(result.error)
}
process.exit(result.status ?? 1)
