import 'dotenv/config'
import { createApp } from './app.js'
import { initFirebase } from './services/firestore.js'

const port = Number(process.env.PORT ?? 4000)
const app = createApp()

// Initialize Firebase Admin SDK on server start
try {
  initFirebase()
  console.log('Firebase Admin SDK initialized')
} catch (error) {
  console.warn('Firebase initialization failed, using mock data fallback:', error)
}

app.listen(port, () => {
  console.log(`SafeCom backend server running on http://127.0.0.1:${port}`)
})
