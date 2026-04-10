import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, 'data')
const DATA_FILE = resolve(DATA_DIR, 'iron-log-data.json')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

function localDataPlugin() {
  return {
    name: 'local-data',
    configureServer(server) {
      server.middlewares.use('/api/data', (req, res) => {
        if (req.method === 'GET') {
          if (!existsSync(DATA_FILE)) {
            res.setHeader('Content-Type', 'application/json')
            res.end('null')
            return
          }
          try {
            const raw = readFileSync(DATA_FILE, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(raw)
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('null')
          }
        } else if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            try {
              writeFileSync(DATA_FILE, JSON.stringify(JSON.parse(body), null, 2), 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end('{"ok":true}')
            } catch (e) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), localDataPlugin()],
  server: {
    port: 3000,
    open: true
  }
})
