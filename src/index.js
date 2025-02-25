#!/usr/local/bin/node

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const errorHandler = require('./middleware/error.middleware')

const app = express()

// CORS configuration
const corsOptions = {
    origin: 'http://localhost:5173', // Vite's default port
    optionsSuccessStatus: 200
}

// Middleware
app.use(cors(corsOptions))
app.use(helmet())
app.use(express.json())
app.use(morgan('dev'))

// Routes
app.use('/api/accounts', require('./routes/account.routes'))
app.use('/api/shifts', require('./routes/shift.routes'))
app.use('/api/workgroups', require('./routes/workgroup.routes'))
app.use('/api/roles', require('./routes/role.routes'))
app.use('/api/calendar', require('./routes/calendar.routes'))
app.use('/api/system', require('./routes/system.routes'))
// Add other routes here as needed

// Error handling
app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`API Server is running on http://localhost:${PORT}`)
})
