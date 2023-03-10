const { databuilderController } = require('../controllers')

const router = require('express').Router()

router.post('/update',databuilderController.update)

router.post('/getByIndex', databuilderController.getByIndex)

module.exports = router
