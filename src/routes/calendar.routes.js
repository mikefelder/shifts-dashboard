const express = require('express')
const router = express.Router()
const calendarController = require('../controllers/calendar.controller')

router.get('/summary', calendarController.getSummary)

module.exports = router
