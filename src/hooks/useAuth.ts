import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  subscribeToAuth,
} from '../lib/firebase';
import { syncUserProfile } from '../utils/firestoreSync';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        syncUserProfile(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (): Promise<User | null> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const loggedUser = await firebaseSignInWithGoogle();
      setUser(loggedUser);
      await syncUserProfile(loggedUser);
      setIsLoggingIn(false);
      return loggedUser;
    } catch (err: unknown) {
      setIsLoggingIn(false);
      let errorMsg = 'Failed to sign in with Google';
      if (err instanceof Error) {
        if (err.message.includes('popup-closed-by-user')) {
          errorMsg = 'Sign in was cancelled';
        } else if (err.message.includes('network-request-failed')) {
          errorMsg = 'Network error. Please check your connection.';
        } else {
          errorMsg = err.message;
        }
      }
      setError(errorMsg);
      console.error('Sign in error:', err);
      return null;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    user,
    loading,
    isLoggingIn,
    error,
    signInWithGoogle: signIn,
    signOut: logout,
    clearError,
  };
}
