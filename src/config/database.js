const mongoose = require('mongoose')

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('Missing required environment variable: MONGODB_URI')
  }

  mongoose.set('strictQuery', false)

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  })

  return mongoose.connection
}

module.exports = connectDatabase

