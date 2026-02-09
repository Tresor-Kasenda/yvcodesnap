export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Validate password strength and complexity
 * Enforces:
 * - Minimum 8 characters
 * - At least 3 of: uppercase, lowercase, numbers, special characters
 * - Not all numbers or all lowercase
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let strength: PasswordValidation['strength'] = 'weak';

  // Minimum length (enforced as 8, not 6)
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Character variety checks
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let varietyScore = 0;
  if (hasUpperCase) varietyScore++;
  if (hasLowerCase) varietyScore++;
  if (hasNumber) varietyScore++;
  if (hasSpecialChar) varietyScore++;

  if (varietyScore < 3) {
    errors.push('Include uppercase, lowercase, numbers, and/or special characters');
  }

  // Common pattern checks
  if (/^[0-9]+$/.test(password)) {
    errors.push('Password cannot be only numbers');
  }

  if (password.toLowerCase() === password) {
    errors.push('Password should include at least one uppercase letter');
  }

  // Calculate strength
  if (password.length >= 12 && varietyScore === 4) {
    strength = 'strong';
  } else if (password.length >= 10 && varietyScore >= 3) {
    strength = 'good';
  } else if (password.length >= 8 && varietyScore >= 2) {
    strength = 'fair';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}
