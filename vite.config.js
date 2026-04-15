import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, 'data')
const DATA_FILE = resolve(DATA_DIR, 'iron-log-data.json')
const LIBRARY_FILE = resolve(DATA_DIR, 'meal-library.json')
const PROGRAM_FILE = resolve(DATA_DIR, 'workout-program.json')

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

function jsonEndpoint(filePath) {
  return (req, res) => {
    if (req.method === 'GET') {
      if (!existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/json')
        res.end('null')
        return
      }
      try {
        const raw = readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'application/json')
        res.end(raw || 'null')
      } catch {
        res.setHeader('Content-Type', 'application/json')
        res.end('null')
      }
    } else if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', () => {
        try {
          writeFileSync(filePath, JSON.stringify(JSON.parse(body), null, 2), 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end('{"ok":true}')
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e.message }))
        }
      })
    }
  }
}

function localDataPlugin() {
  return {
    name: 'local-data',
    configureServer(server) {
      server.middlewares.use('/api/data', jsonEndpoint(DATA_FILE))
      server.middlewares.use('/api/library', jsonEndpoint(LIBRARY_FILE))
      server.middlewares.use('/api/program', jsonEndpoint(PROGRAM_FILE))
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
