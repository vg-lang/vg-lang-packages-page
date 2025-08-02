import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/userService'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Create user using MongoDB
    const result = await UserService.createUser(username, email, password)

    if (result.success) {
      return NextResponse.json(
        { message: 'User created successfully' },
        { status: 201 }
      )
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 409 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 