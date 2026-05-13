import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.PORT) || (isProd ? 3000 : 3001)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: isProd ? 'production' : 'development' })
})

if (isProd) {
  const dist = path.join(__dirname, '../client/dist')
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}/api/health`)
  if (isProd) {
    console.log(`App   http://localhost:${PORT}/`)
  }
})
