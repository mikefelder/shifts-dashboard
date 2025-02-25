const express = require('express')
const router = express.Router()
const systemController = require('../controllers/system.controller')

router.post('/echo', systemController.echo)

module.exports = router
