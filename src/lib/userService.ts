import clientPromise from './mongodb'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

const DATABASE_NAME = 'vg_package_manager'
const USERS_COLLECTION = 'users'

export interface User {
  _id?: ObjectId
  username: string
  email: string
  password: string
  salt?: string
  createdAt?: Date
  lastLogin?: Date
}

export class UserService {
  static async createUser(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = await clientPromise
      const db = client.db(DATABASE_NAME)
      const users = db.collection(USERS_COLLECTION)

      // Check if user already exists
      const existingUser = await users.findOne({ username })
      if (existingUser) {
        return { success: false, error: 'Username already exists' }
      }

      const existingEmail = await users.findOne({ email })
      if (existingEmail) {
        return { success: false, error: 'Email already exists' }
      }

      // Hash password with bcrypt (same as CLI)
      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser: User = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      }

      await users.insertOne(newUser)
      return { success: true }
    } catch (error) {
      console.error('Error creating user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  static async authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const client = await clientPromise
      const db = client.db(DATABASE_NAME)
      const users = db.collection(USERS_COLLECTION)

      const user = await users.findOne({ username })
      if (!user) {
        return { success: false, error: 'Invalid username or password' }
      }

      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' }
      }

      // Update last login time
      await users.updateOne(
        { username },
        { $set: { lastLogin: new Date() } }
      )

      // Return user without password
      const { password: _, ...userWithoutPassword } = user
      return { success: true, user: userWithoutPassword }
    } catch (error) {
      console.error('Error authenticating user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const client = await clientPromise
      const db = client.db(DATABASE_NAME)
      const users = db.collection(USERS_COLLECTION)

      const user = await users.findOne({ username })
      if (user) {
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword as User
      }
      return null
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }

  static async deleteUser(username: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = await clientPromise
      const db = client.db(DATABASE_NAME)
      const users = db.collection(USERS_COLLECTION)

      const result = await users.deleteOne({ username })
      if (result.deletedCount === 0) {
        return { success: false, error: 'User not found' }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
} 