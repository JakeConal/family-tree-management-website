import { NextResponse } from 'next/server'

export async function POST() {
  // Clear the auth cookie
  const response = NextResponse.json(
    { message: 'Logout successful' },
    { status: 200 }
  )

  response.cookies.delete('auth-token')

  return response
}
