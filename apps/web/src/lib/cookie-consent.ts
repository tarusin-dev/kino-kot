export type CookieConsentValue = 'accepted' | 'rejected';

export const COOKIE_CONSENT_STORAGE_KEY = 'kinokot_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'kinokot_cookie_consent_change';

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function saveCookieConsent(value: CookieConsentValue) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  } catch {
    // If storage is unavailable, keep the in-memory event flow working.
  }

  window.dispatchEvent(
    new CustomEvent<{ value: CookieConsentValue }>(COOKIE_CONSENT_EVENT, {
      detail: { value },
    }),
  );
}
