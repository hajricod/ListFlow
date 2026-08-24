import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle as firebaseSignInWithGoogle,
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  resetPassword as firebaseResetPassword,
  signOut as firebaseSignOut,
  subscribeToAuth,
} from '../lib/firebase';
import { syncUserProfile } from '../utils/firestoreSync';

function formatAuthError(err: unknown, language: 'en' | 'ar' = 'en'): string {
  if (!(err instanceof Error)) return language === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred';
  const msg = err.message || '';

  if (msg.includes('auth/operation-not-allowed') || msg.includes('operation-not-allowed')) {
    return language === 'ar'
      ? 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في مشروع Firebase. يرجى استخدام "المتابعة باستخدام Google".'
      : 'Email/Password sign-in is not enabled for this Firebase project. Please use "Continue with Google".';
  }
  if (msg.includes('auth/popup-blocked') || msg.includes('popup-blocked')) {
    return language === 'ar'
      ? 'تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة.'
      : 'Sign-in popup was blocked by browser. Please enable popups.';
  }
  if (msg.includes('auth/unauthorized-domain') || msg.includes('unauthorized-domain')) {
    return language === 'ar'
      ? 'النطاق الحالي غير مضاف إلى نطاقات Firebase المعتمدة.'
      : 'This domain is not authorized in Firebase project settings.';
  }
  if (msg.includes('popup-closed-by-user') || msg.includes('cancelled')) {
    return language === 'ar' ? 'تم إلغاء عملية تسجيل الدخول' : 'Sign in was cancelled';
  }
  if (msg.includes('auth/email-already-in-use') || msg.includes('email-already-in-use')) {
    return language === 'ar'
      ? 'البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استعادة كلمة المرور.'
      : 'This email is already in use. Please sign in instead.';
  }
  if (msg.includes('auth/invalid-email') || msg.includes('invalid-email')) {
    return language === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email address';
  }
  if (msg.includes('auth/user-not-found') || msg.includes('user-not-found')) {
    return language === 'ar' ? 'لم يتم العثور على حساب بهذا البريد' : 'No account found with this email';
  }
  if (msg.includes('auth/wrong-password') || msg.includes('wrong-password')) {
    return language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Incorrect password';
  }
  if (msg.includes('auth/invalid-credential') || msg.includes('invalid-credential')) {
    return language === 'ar' ? 'بيانات الاعتماد غير صالحة. تأكد من البريد وكلمة المرور' : 'Invalid email or password';
  }
  if (msg.includes('auth/weak-password') || msg.includes('weak-password')) {
    return language === 'ar' ? 'كلمة المرور ضعيفة. يجب أن تتكون من 6 أحرف على الأقل' : 'Password is too weak (min 6 characters)';
  }
  if (msg.includes('auth/too-many-requests') || msg.includes('too-many-requests')) {
    return language === 'ar'
      ? 'تم حظر الطلبات مؤقتاً لكثرة المحاولات. يرجى المحاولة لاحقاً'
      : 'Too many attempts. Please try again later.';
  }
  if (msg.includes('network-request-failed')) {
    return language === 'ar' ? 'خطأ في الاتصال بالإنترنت. يرجى التحقق من الشبكة' : 'Network error. Please check your connection.';
  }
  return msg;
}

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

  const signIn = useCallback(async (lang: 'en' | 'ar' = 'en'): Promise<User | null> => {
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
      const errorMsg = formatAuthError(err, lang);
      setError(errorMsg);
      console.error('Google Sign in error:', err);
      return null;
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string, lang: 'en' | 'ar' = 'en'): Promise<User | null> => {
      setIsLoggingIn(true);
      setError(null);
      try {
        const loggedUser = await firebaseSignInWithEmail(email, password);
        setUser(loggedUser);
        await syncUserProfile(loggedUser);
        setIsLoggingIn(false);
        return loggedUser;
      } catch (err: unknown) {
        setIsLoggingIn(false);
        const errorMsg = formatAuthError(err, lang);
        setError(errorMsg);
        console.error('Email Sign In error:', err);
        return null;
      }
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      displayName?: string,
      lang: 'en' | 'ar' = 'en'
    ): Promise<User | null> => {
      setIsLoggingIn(true);
      setError(null);
      try {
        const newUser = await firebaseSignUpWithEmail(email, password, displayName);
        setUser(newUser);
        await syncUserProfile(newUser);
        setIsLoggingIn(false);
        return newUser;
      } catch (err: unknown) {
        setIsLoggingIn(false);
        const errorMsg = formatAuthError(err, lang);
        setError(errorMsg);
        console.error('Email Sign Up error:', err);
        return null;
      }
    },
    []
  );

  const sendPasswordReset = useCallback(
    async (email: string, lang: 'en' | 'ar' = 'en'): Promise<boolean> => {
      setIsLoggingIn(true);
      setError(null);
      try {
        await firebaseResetPassword(email);
        setIsLoggingIn(false);
        return true;
      } catch (err: unknown) {
        setIsLoggingIn(false);
        const errorMsg = formatAuthError(err, lang);
        setError(errorMsg);
        console.error('Password reset error:', err);
        return false;
      }
    },
    []
  );

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
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    signOut: logout,
    clearError,
  };
}

