// Maps a failed auth request (an ApiError from services/api.js) to an i18n key.
// Decisions are made on HTTP status / isNetworkError, never on message text,
// so every user-facing auth error is translated.
//
// context: 'login' | 'register'
export function authErrorKey(err, context = 'login') {
  if (err?.isNetworkError) return 'authErrors.network'

  const status = err?.status
  if (status === 429) return 'authErrors.tooMany'
  if (status >= 500) return 'authErrors.server'

  if (context === 'login') return 'authErrors.invalidCredentials'
  if (status === 409) return 'authErrors.accountExists'
  return 'authErrors.generic'
}
