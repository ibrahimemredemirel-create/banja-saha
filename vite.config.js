import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import stateApiHandler from './api/state.js'

const localApiPlugin = () => ({
  name: 'banja-local-api',
  configureServer(server) {
    server.middlewares.use('/api/state', async (req, res) => {
      await stateApiHandler(req, res)
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
