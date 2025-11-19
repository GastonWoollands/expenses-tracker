/**
 * Firebase authentication utilities
 */

import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from './config'

// Get User type from the return type of createUserWithEmailAndPassword
type User = Awaited<ReturnType<typeof createUserWithEmailAndPassword>>['user']

// Firebase auth errors have a code property
export interface AuthError {
  code: string
  message: string
}

export type AuthUser = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

export const signUp = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('Error signing up:', error)
    return { user: null, error: { code: error.code || 'unknown', message: error.message || 'An error occurred' } }
  }
}

export const signIn = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('Error signing in:', error)
    return { user: null, error: { code: error.code || 'unknown', message: error.message || 'An error occurred' } }
  }
}

export const logout = async (): Promise<{ error: AuthError | null }> => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    console.error('Error signing out:', error)
    return { error: { code: error.code || 'unknown', message: error.message || 'An error occurred' } }
  }
}

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

export const formatAuthUser = (user: User): AuthUser => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified
  }
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    return auth.currentUser
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const getSession = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser
    if (!user) {
      console.warn('No current user found in auth')
      return null
    }
    
    const token = await user.getIdToken()
    if (!token) {
      console.warn('Failed to get ID token from user')
      return null
    }
    
    console.log('Token obtained successfully, length:', token.length)
    return token
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

