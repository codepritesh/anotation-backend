const mongoose = require('mongoose')

const Schema = mongoose.Schema({
  answer: { type: String },
  answer_start: { type: Number },
  context: { type: String },
  index: { type: Number , unique: true},  
  question: { type: String },
  validated: { type: Boolean }
})

const Databuilder = mongoose.model('Databuilder', Schema)
module.exports = Databuilder
