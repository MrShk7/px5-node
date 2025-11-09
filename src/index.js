require('dotenv').config()

const cors = require('cors')
const express = require('express')

const connectDatabase = require('./config/database')
const router = require('./routes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
)
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use('/api', router)

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'StudioFlow backend is running',
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  })
})

app.use(errorHandler)

const startServer = async () => {
  try {
    const connection = await connectDatabase()

    connection.on('connected', () => {
      console.log('Connected to MongoDB')
    })

    connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

