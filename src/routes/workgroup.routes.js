const express = require('express')
const router = express.Router()
const workgroupController = require('../controllers/workgroup.controller')

router.get('/list', workgroupController.listWorkgroups)
router.get('/:workgroupId/roles', workgroupController.listRoles)

module.exports = router
