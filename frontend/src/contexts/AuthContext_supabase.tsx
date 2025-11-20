/**
 * Authentication context for managing user state with Firebase
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChange, formatAuthUser, signUp, signIn, logout } from '../firebase/auth'
import type { AuthUser } from '../firebase/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChange((user: any) => {
        if (user) {
          setUser(formatAuthUser(user))
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error('Error in AuthProvider useEffect:', error)
      setLoading(false)
    }
  }, [])

  const handleSignUp = async (email: string, password: string) => {
    const { error } = await signUp(email, password)
    if (error) {
      throw new Error(error.message)
    }
  }

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password)
    if (error) {
      throw new Error(error.message)
    }
  }

  const handleLogout = async () => {
    const { error } = await logout()
    if (error) {
      throw new Error(error.message)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    logout: handleLogout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
