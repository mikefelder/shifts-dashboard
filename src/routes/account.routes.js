const express = require('express')
const router = express.Router()
const accountController = require('../controllers/account.controller')

router.get('/list', accountController.listAccounts)
router.get('/self', accountController.getSelf)
router.get('/workgroup/:workgroupId', accountController.listByWorkgroup)
router.get('/:accountId', accountController.getAccount)

module.exports = router
