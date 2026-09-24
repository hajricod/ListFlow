import { UserSubscription, SubscriptionCycle } from '../types';

export const DEFAULT_FREE_SUBSCRIPTION: UserSubscription = {
  tier: 'free',
  status: 'free',
};

const STORAGE_KEY = 'listflow_user_subscription';

/**
 * Check if a subscription is currently active Pro or in trial.
 */
export function isProUser(subscription?: UserSubscription | null): boolean {
  if (!subscription) return false;
  if (subscription.tier !== 'pro') return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return false;
  if (subscription.expiresAt) {
    const expiry = new Date(subscription.expiresAt).getTime();
    if (Date.now() > expiry) return false;
  }
  return true;
}

/**
 * Load local cached subscription.
 */
export function getLocalSubscription(): UserSubscription {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FREE_SUBSCRIPTION;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.tier) {
      return parsed as UserSubscription;
    }
    return DEFAULT_FREE_SUBSCRIPTION;
  } catch {
    return DEFAULT_FREE_SUBSCRIPTION;
  }
}

/**
 * Persist subscription to local storage.
 */
export function setLocalSubscription(sub: UserSubscription): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  } catch (err) {
    console.warn('Could not save local subscription:', err);
  }
}

/**
 * Generate an active Pro subscription object.
 */
export function createProSubscription(cycle: SubscriptionCycle = 'yearly'): UserSubscription {
  const now = new Date();
  const expires = new Date();
  if (cycle === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
  } else {
    expires.setMonth(expires.getMonth() + 1);
  }

  return {
    tier: 'pro',
    status: 'active',
    cycle,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    autoRenew: true,
  };
}

/**
 * Generate a 7-day Free Trial subscription.
 */
export function createTrialSubscription(): UserSubscription {
  const now = new Date();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  return {
    tier: 'pro',
    status: 'trialing',
    cycle: 'yearly',
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    autoRenew: true,
  };
}

/**
 * Cancellation helper (cancels Pro subscription and sets tier to free).
 */
export function cancelSubscription(sub: UserSubscription): UserSubscription {
  return {
    ...sub,
    tier: 'free',
    status: 'free',
    autoRenew: false,
    canceledAt: new Date().toISOString(),
  };
}

/**
 * Immediate downgrade to Free Tier.
 */
export function downgradeToFreeSubscription(): UserSubscription {
  return {
    tier: 'free',
    status: 'free',
    autoRenew: false,
    canceledAt: new Date().toISOString(),
  };
}

/**
 * Disable auto-renew while retaining active Pro status until expiration.
 */
export function disableAutoRenew(sub: UserSubscription): UserSubscription {
  return {
    ...sub,
    autoRenew: false,
  };
}
