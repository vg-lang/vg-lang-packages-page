import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserService } from '@/lib/userService'

// Extend the User type to include our custom fields
declare module "next-auth" {
  interface User {
    username?: string
    packages?: any[]
  }
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string
      packages?: any[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string
    packages?: any[]
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const result = await UserService.authenticateUser(credentials.username, credentials.password)
        
        if (result.success && result.user) {
          return {
            id: result.user._id?.toString() || result.user.username,
            username: result.user.username,
            email: result.user.email,
            packages: result.user.packages || []
          }
        }
        
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username
        token.packages = user.packages
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.username = token.username
        session.user.packages = token.packages
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin'
  }
})

export { handler as GET, handler as POST } 