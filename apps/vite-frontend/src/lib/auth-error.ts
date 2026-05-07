import axios from 'axios';

type Translator = (key: string) => string;

// Maps a thrown auth error to a translated user-facing message. Falls back to
// the supplied fallback key for anything we don't explicitly classify so the
// UI never shows raw HTTP details.
export function resolveAuthErrorMessage(error: unknown, t: Translator, fallbackKey: string): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      return t('auth.invalidCredentials');
    }

    if (status === 409) {
      return t('auth.emailAlreadyInUse');
    }

    if (status === 429) {
      return t('auth.tooManyAttempts');
    }

    if (error.code === 'ERR_NETWORK') {
      return t('auth.networkError');
    }
  }

  return t(fallbackKey);
}
