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

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser: User = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date()
      }

      await users.insertOne(newUser)
      console.log(`✅ User created: ${username}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error creating user:', error)
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
      console.log(`✅ User authenticated: ${username}`)
      return { success: true, user: userWithoutPassword }
    } catch (error) {
      console.error('❌ Error authenticating user:', error)
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
      console.error('❌ Error getting user:', error)
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

      console.log(`✅ User deleted: ${username}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error deleting user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  static async getAllUsers(): Promise<User[]> {
    try {
      const client = await clientPromise
      const db = client.db(DATABASE_NAME)
      const users = db.collection(USERS_COLLECTION)

      const allUsers = await users.find({}).toArray()
      return allUsers.map(user => {
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword as User
      })
    } catch (error) {
      console.error('❌ Error getting all users:', error)
      return []
    }
  }

  static async updateUser(username: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const client = await clientPromise
      const db = client.db(DATABASE_NAME)
      const users = db.collection(USERS_COLLECTION)

      // Remove password from updates if present
      const { password, ...safeUpdates } = updates

      const result = await users.updateOne(
        { username },
        { $set: safeUpdates }
      )

      if (result.matchedCount === 0) {
        return { success: false, error: 'User not found' }
      }

      console.log(`✅ User updated: ${username}`)
      return { success: true }
    } catch (error) {
      console.error('❌ Error updating user:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
} 