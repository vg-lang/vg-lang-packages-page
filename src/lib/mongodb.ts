import { MongoClient } from 'mongodb'

// Configuration management - prioritize environment variables for Vercel
const getMongoUri = (): string => {
  // Check for environment variable first (for Vercel deployment)
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI
  }
  
  // Check for local config file (for development)
  try {
    const fs = require('fs')
    const path = require('path')
    const configPath = path.join(process.cwd(), 'mongodb.config')
    
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8')
      const lines = config.split('\n')
      for (const line of lines) {
        if (line.startsWith('mongodb.uri=')) {
          return line.split('=')[1].trim()
        }
      }
    }
  } catch (error) {
    console.warn('Could not read local config file:', error)
  }
  
  // Default fallback
  return "mongodb://localhost:27017"
}

const uri = getMongoUri()
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const client = await clientPromise
    await client.db('admin').command({ ping: 1 })
    console.log('✅ MongoDB connection successful')
    return true
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    return false
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise 