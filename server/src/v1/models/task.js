const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { schemaOptions } = require('./modelOptions')

const taskSchema = new Schema({
  section: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Section', 
    required: true 
  },
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  },
  position: {
    type: Number
  },
  closingDate: {
    type: Date 
  },
}, schemaOptions)

module.exports = mongoose.model('Task', taskSchema)