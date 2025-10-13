/**
 * Supabase authentication utilities
 */

import { supabase } from './config'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

export const signUp = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { user: data.user, error }
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

export const signIn = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { user: data.user, error }
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export const logout = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

export const formatAuthUser = (user: User): AuthUser => {
  return {
    uid: user.id,
    email: user.email,
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
    photoURL: user.user_metadata?.avatar_url || null,
    emailVerified: !!user.email_confirmed_at
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const getSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}
