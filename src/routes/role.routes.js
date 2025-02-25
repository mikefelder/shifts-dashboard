const express = require('express')
const router = express.Router()
const roleController = require('../controllers/role.controller')

router.get('/list', roleController.listRoles)
router.get('/:roleId', roleController.getRole)

module.exports = router
