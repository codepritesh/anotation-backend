const express = require('express')
const dataBaseConfig = require('./config/databases')
const routes = require('./api/v1/routes/index')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()
const port = 8083

app.use(cors())
app.use(express.json())
app.use('/v1', routes)



app.get('/', (req, res) => {
    res.send('App works')
  })


mongoose.connect(dataBaseConfig.url, dataBaseConfig.options).then(() => {
    app.listen(port, function (err) {
      if (err) {
        console.warn(err)
      }
      console.log('running server on from port:' + port)
    })
  })