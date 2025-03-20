// src/middleware.js
import { NextResponse } from 'next/server'

export default function middleware(request) {
  const user = request.cookies.get('user')
  const pathname = request.nextUrl.pathname

  console.log('Middleware - Current Path:', pathname);
  console.log('Middleware - User Cookie:', user);

  // if no user and not on login page, redirect to login
  if (!user && pathname !== '/login') {
    console.log('Redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // if user exists and on login page, redirect to home
  if (user && pathname === '/login') {
    console.log('Redirecting to home');
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login']
}