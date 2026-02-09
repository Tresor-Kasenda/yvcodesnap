/**
 * Determine if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return true;
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code;
    return errorCode === 'NETWORK_ERROR' || errorCode === 'TIMEOUT';
  }

  return false;
}

/**
 * Get user-friendly error message from various error sources
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Handle network errors
  if (isNetworkError(error)) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Map common Supabase/Auth errors to friendly messages
    if (message.includes('invalid login credentials') || message.includes('invalid') || message.includes('credentials')) {
      return 'Invalid email or password. Please try again.';
    }

    if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
      return 'Please verify your email address before logging in.';
    }

    if (message.includes('user already registered') || message.includes('already_exists')) {
      return 'An account with this email already exists. Try logging in instead.';
    }

    if (message.includes('email_rate_limit')) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }

    if (message.includes('password')) {
      return 'Password does not meet security requirements. Try a stronger password.';
    }

    if (message.includes('validation')) {
      return 'Please check your input and try again.';
    }

    // For other errors, return original if it's reasonable, otherwise generic message
    if (message.length > 0 && message.length < 200) {
      return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract error message safely from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as { message: unknown };
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }

  return 'An unexpected error occurred';
}
