const express = require('express')
const router = express.Router()
const shiftController = require('../controllers/shift.controller')

router.get('/list', shiftController.listShifts)
router.get('/whos-on', shiftController.whosOn)

module.exports = router
