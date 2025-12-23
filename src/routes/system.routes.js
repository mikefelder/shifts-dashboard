const express = require('express')
const router = express.Router()
const systemController = require('../controllers/system.controller')

// Health check endpoint for Azure App Service
router.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

router.post('/echo', systemController.echo)

module.exports = router
