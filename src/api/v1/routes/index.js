const router = require('express').Router()

const databuilderRoute = require('./databuilder.route')

router.use('/databuilder', databuilderRoute)

module.exports = router
