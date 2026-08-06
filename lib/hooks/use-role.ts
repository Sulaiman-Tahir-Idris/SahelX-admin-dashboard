"use client"

import { useAuth } from '@/lib/auth-utils'

export function useRole(): string {
  const { user } = useAuth ? useAuth() : { user: null }
  
  if (user?.role) {
    return user.role.toLowerCase()
  }
  
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('adminUser')
      if (stored) {
        return (JSON.parse(stored).role || '').toLowerCase()
      }
    } catch {
      return ''
    }
  }
  
  return ''
}
