const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })
module.exports = {
  url: process.env.MONGODB_URL,
  options: {
  }
}
