import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Not runnable: one readable file with only project sources; deps/assets stay as imports. */
function isNodeModule(resolvedPath) {
  const normalized = path.normalize(resolvedPath)
  return normalized.includes(`${path.sep}node_modules${path.sep}`)
}

function isExternal(id) {
  if (id.startsWith('\0')) return false
  const clean = id.split('?')[0]
  if (/\.(png|jpe?g|webp|svg|gif|ico)$/i.test(clean)) return true
  if (path.isAbsolute(clean)) return isNodeModule(clean)
  return !clean.startsWith('.')
}

export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    {
      name: 'analyze-strip-css',
      enforce: 'pre',
      load(id) {
        const base = id.split('?')[0]
        if (base.endsWith('.css')) return 'export default {}'
      },
    },
    {
      name: 'analyze-drop-css-output',
      writeBundle(outputOptions, bundle) {
        const dir = outputOptions.dir ?? path.dirname(outputOptions.file)
        for (const fileName of Object.keys(bundle)) {
          if (!fileName.endsWith('.css')) continue
          try {
            fs.unlinkSync(path.join(dir, fileName))
          } catch {
            /* ignore */
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist-analyze',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    codeSplitting: false,
    lib: {
      entry: path.resolve(__dirname, 'src/main.jsx'),
      formats: ['es'],
      fileName: () => 'my-code.js',
    },
    rollupOptions: {
      external: isExternal,
    },
  },
})
