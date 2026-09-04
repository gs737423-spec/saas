import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const root = process.cwd()
const codeRoots = ['api', 'src']
const privilegedBoundary = 'src/server/integrations/supabaseAdmin.ts'
const publicClient = 'src/lib/supabaseClient.ts'
const violations = []

function filesUnder(directory) {
  const absolute = resolve(root, directory)
  return readdirSync(absolute).flatMap((name) => {
    const path = resolve(absolute, name)
    if (statSync(path).isDirectory()) return filesUnder(relative(root, path))
    return /\.(?:ts|tsx)$/.test(path) ? [path] : []
  })
}

for (const file of codeRoots.flatMap(filesUnder)) {
  const name = relative(root, file).replaceAll('\\', '/')
  const source = readFileSync(file, 'utf8')
  if (/(?:process\.env\.|getServerEnv\(['"])SUPABASE_SERVICE_ROLE_KEY/.test(source) && name !== privilegedBoundary) {
    violations.push(`${name}: service-role environment key outside privileged boundary`)
  }
  if (/\bcreateClient\s*\(/.test(source) && name !== privilegedBoundary && name !== publicClient) {
    violations.push(`${name}: direct Supabase client construction outside approved boundaries`)
  }
  if (name.startsWith('src/') && !name.startsWith('src/server/') && source.includes('getSupabaseAdmin')) {
    violations.push(`${name}: privileged client imported into browser-capable source`)
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'))
  process.exit(1)
}

console.log('service-role boundary scan: PASS')
