import mongoose from 'mongoose'
import { env } from './env'

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
    })
    if (env.isDev) {
      console.log(`MongoDB connected: ${conn.connection.host}`)
    }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}
